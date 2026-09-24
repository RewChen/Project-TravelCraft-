import { useState, useRef } from 'react';
import { Map, X, Plus, UploadCloud, ImagePlus, FileImage } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { uploadMapCover } from '../../../lib/supabaseUploads';
import { isSupabaseConfigured } from '../../../lib/supabaseClient';

export default function AddBaseMapModal({ isOpen, onClose }) {
  const { addBaseMap, showAdminToast } = useApp();
  const [mapName, setMapName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      showAdminToast('Please choose an image file (JPG, PNG, WebP, GIF...).', 'error');
      return;
    }
    setImageFile(file);
    setImageUrl('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resolveImage = (mapId) =>
    new Promise((resolve) => {
      if (imageFile) {
        if (isSupabaseConfigured) {
          uploadMapCover(mapId, imageFile)
            .then((url) => resolve(url || previewUrl))
            .catch((err) => {
              console.warn('Base map image upload skipped:', err);
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => resolve(previewUrl || '');
              reader.readAsDataURL(imageFile);
            });
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(previewUrl || '');
          reader.readAsDataURL(imageFile);
        }
      } else {
        resolve((imageUrl || '').trim());
      }
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = mapName.trim();
    if (!title) {
      showAdminToast('Base map title is required.', 'error');
      return;
    }
    if (!imageFile && !imageUrl.trim()) {
      showAdminToast('Add an image — upload a file or paste a link.', 'error');
      return;
    }
    setUploading(true);
    const mapId = `base-${Date.now()}`;
    const image = await resolveImage(mapId);
    await addBaseMap({ name: title, image }, mapId);
    setUploading(false);
    setMapName('');
    setImageUrl('');
    setPreviewUrl('');
    clearImage();
    onClose();
  };

  const showPreview = previewUrl || imageUrl;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg ring-1 ring-brand-dark/[0.06] shadow-[0_25px_60px_-25px_rgba(45,58,46,0.4)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            <h3 className="text-base font-bold uppercase tracking-wider">Add New Base Map</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5 text-brand-dark/60">
              Base Map Title
            </label>
            <input
              type="text"
              required
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="e.g. Celestial Highlands"
              className="w-full bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl p-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase mb-1.5 text-brand-dark/60">
              Map Image
            </label>

            {/* Upload file or paste link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-brand-dark/15 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-brand-light/40">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="base-map-file-input"
                />
                <label
                  htmlFor="base-map-file-input"
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-brand-dark rounded-full text-xs font-semibold uppercase shadow-[0_4px_20px_-10px_rgba(45,58,46,0.2)] flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Image File</span>
                </label>
                <span className="text-[10px] text-brand-dark/50 font-medium">
                  {imageFile ? imageFile.name : 'JPG / PNG / WebP (upload)'}
                </span>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-brand-dark/40">
                  <span className="flex-1 h-0.5 bg-brand-dark/10"></span>
                  <span>or</span>
                  <span className="flex-1 h-0.5 bg-brand-dark/10"></span>
                </div>
                <div className="relative">
                  <FileImage className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      if (imageFile) {
                        setImageFile(null);
                        setPreviewUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }
                    }}
                    placeholder="Paste image link: https://..."
                    className="w-full bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl p-2 pl-9 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-dark/20"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview ? (
              <div className="mt-3 relative">
                <div className="h-40 bg-brand-light/60 ring-1 ring-brand-dark/[0.06] rounded-xl overflow-hidden">
                  <img
                    src={showPreview}
                    alt="Base map preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3 w-full h-40 bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-xl flex flex-col items-center justify-center gap-2 text-brand-dark/40">
                <ImagePlus className="w-8 h-8" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  No Image — Upload or Paste a Link
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-brand-light/40 ring-1 ring-brand-dark/10 rounded-full font-semibold text-xs uppercase cursor-pointer hover:bg-brand-light"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 text-white rounded-full font-semibold text-xs uppercase flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Create Base Map'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}