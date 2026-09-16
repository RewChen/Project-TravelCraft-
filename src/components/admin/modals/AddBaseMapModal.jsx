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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono animate-in fade-in duration-150">
      <div className="bg-white border-4 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#cc0000] text-white p-4 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            <h3 className="text-base font-black uppercase tracking-wider">Add New Base Map</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black hover:bg-neutral-800 text-white rounded-lg border-2 border-white flex items-center justify-center cursor-pointer transition-transform active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Base Map Title
            </label>
            <input
              type="text"
              required
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              placeholder="e.g. Celestial Highlands"
              className="w-full bg-gray-50 border-2 border-black rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase mb-1.5 text-gray-700">
              Map Image
            </label>

            {/* Upload file or paste link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-black rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-gray-50">
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
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Image File</span>
                </label>
                <span className="text-[10px] text-gray-500 font-bold">
                  {imageFile ? imageFile.name : 'JPG / PNG / WebP (upload)'}
                </span>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                  <span className="flex-1 h-0.5 bg-gray-200"></span>
                  <span>or</span>
                  <span className="flex-1 h-0.5 bg-gray-200"></span>
                </div>
                <div className="relative">
                  <FileImage className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                    className="w-full bg-gray-50 border-2 border-black rounded-xl p-2 pl-9 text-xs font-bold focus:outline-none focus:bg-amber-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview ? (
              <div className="mt-3 relative">
                <div className="h-40 bg-gray-200 border-4 border-black rounded-xl overflow-hidden">
                  <img
                    src={showPreview}
                    alt="Base map preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-black hover:bg-neutral-800 text-white rounded-lg border-2 border-white flex items-center justify-center cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3 w-full h-40 bg-gray-100 border-2 border-black rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400">
                <ImagePlus className="w-8 h-8" />
                <span className="text-[10px] font-black uppercase tracking-wider">
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
              className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 border-2 border-black rounded-xl font-bold text-xs uppercase cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2.5 bg-[#cc0000] hover:bg-red-700 text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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