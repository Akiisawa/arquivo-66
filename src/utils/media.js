let base64TempMedia = '';

export const getBase64Temp = () => base64TempMedia;
export const setBase64Temp = (v) => { base64TempMedia = v; };

export function lidarComUploadMidia(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById('preview-upload');
  const reader = new FileReader();

  reader.onload = (e) => {
    if (file.type.indexOf('video/') === 0) {
      base64TempMedia = e.target.result;
      if (preview) preview.innerHTML = '<span style="color:var(--amber-alert)">Video carregado.</span>';
      return;
    }
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width;
      let h = img.height;
      if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
      else if (h > MAX) { w *= MAX / h; h = MAX; }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      base64TempMedia = canvas.toDataURL('image/jpeg', 0.7);
      if (preview) preview.innerHTML = '<img src="' + base64TempMedia + '" style="max-width:100%;border:1px solid #333;border-radius:6px;">';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export function renderizarMidia(base64Str) {
  if (!base64Str) return '';
  if (base64Str.indexOf('data:video') === 0) {
    return '<video controls class="img-missao"><source src="' + base64Str + '"></video>';
  }
  return '<img src="' + base64Str + '" class="img-missao">';
}