/**
 * Lee un archivo de imagen y devuelve un data URI cuadrado reducido
 * (por defecto 48px), para guardar iconos pequeños en una columna `text`.
 */
export function fileToResizedDataUrl(file, size = 48) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo procesar la imagen.'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        // webp si el navegador lo soporta; si no, toDataURL cae a png.
        resolve(canvas.toDataURL('image/webp', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
