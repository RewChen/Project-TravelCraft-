

import { useRef, useState } from 'react';
import { Map, LogOut, Check, Sparkles, User as UserIcon, Camera, Pencil } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isAvatarImage } from '../lib/imageUtils';
import AvatarCropModal from '../components/profile/AvatarCropModal';

export default function ProfilePage() {
  const { t, userProfile, updateUserRole, updateUsername, updateUserAvatar, isLoggedIn, isAdminLoggedIn, logout, communityMaps, setAuthMode, navigateTo } = useApp();
  const [selectedRole, setSelectedRole] = useState(userProfile?.role || t('auth.roleNovice'));
  const [roleUpdatedMsg, setRoleUpdatedMsg] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameUpdatedMsg, setUsernameUpdatedMsg] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState('');
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const fileInputRef = useRef(null);

  const availableRoles = [
    { name: 'auth.roleNovice', badge: '🟢', color: 'bg-emerald-100 text-emerald-800' },
    { name: 'auth.roleCartographer',   badge: '📜', color: 'bg-amber-100 text-amber-900' },
  ];

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    updateUserRole(newRole);
    setRoleUpdatedMsg(true);
    setTimeout(() => setRoleUpdatedMsg(false), 3000);
  };

  const startEditUsername = () => {
    setUsernameDraft(userProfile?.name || '');
    setUsernameError('');
    setUsernameUpdatedMsg(false);
    setEditingUsername(true);
  };

  const handleUsernameSave = async (e) => {
    e.preventDefault();
    const result = await updateUsername(usernameDraft);
    if (result.success) {
      setEditingUsername(false);
      setUsernameUpdatedMsg(true);
      setTimeout(() => setUsernameUpdatedMsg(false), 3000);
    } else if (result.error === 'taken') {
      setUsernameError(t('profile.usernameTaken'));
    } else if (result.error === 'validation') {
      setUsernameError(t('profile.usernameValidation'));
    } else {
      setUsernameError(t('profile.usernameUpdateFailed'));
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingAvatar(file);
    event.target.value = '';
  };

  const handleAvatarCropped = async (croppedFile) => {
    setPendingAvatar(null);
    setAvatarStatus('saving');
    const result = await updateUserAvatar(croppedFile);
    setAvatarStatus(result?.success ? 'success' : 'error');
    setTimeout(() => setAvatarStatus(''), 3000);
  };

  // Maps shown here are ONLY ones this user actually pushed. ownerId alone is
  // not enough: private editor drafts (registerEditorDraft) also carry it.
  // The publish modal short-circuits 'private', so any map with privacy
  // 'public'/'unlisted' was really pushed; 'private' rows are excluded.
  const myPublishedMaps = communityMaps?.filter(
    (m) => m.ownerId === userProfile?.id && m.privacy !== 'private'
  ) ?? [];

  if (!isLoggedIn || !userProfile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center font-thai text-brand-dark dark:text-slate-100">
        <div className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full mx-auto flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold uppercase">{t('profile.lockedTitle')}</h2>
          <p className="text-xs text-brand-dark/60">
            {t('profile.lockedDesc')}
          </p>
          <button
            onClick={() => { setAuthMode('login'); navigateTo('auth'); }}
            className="w-full bg-[#cc0000] hover:bg-[#b30000] text-white font-semibold py-3 rounded-full text-xs uppercase cursor-pointer transition-colors"
          >
            {t('profile.loginNow')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-10 pb-12 space-y-6 font-thai text-brand-dark dark:text-slate-100">

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(45,58,46,0.10)] ring-1 ring-brand-dark/[0.06] grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Avatar Column */}
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-brand-dark/[0.06] pb-6 md:pb-0 md:pr-6">
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-24 h-24 bg-brand-dark rounded-full flex items-center justify-center text-4xl overflow-hidden transition-transform hover:scale-105"
              title={t('profile.changeImage')}
            >
              {isAvatarImage(userProfile.avatar) ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userProfile.avatar || '🏃'
              )}
              <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          {avatarStatus === 'saving' && (
            <span className="text-[10px] text-brand-dark/50 font-medium mb-1">{t('profile.avatarUploading')}</span>
          )}
          {avatarStatus === 'success' && (
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mb-1">
              <Check className="w-3 h-3 stroke-[3]" /> {t('profile.avatarUpdated')}
            </span>
          )}
          {avatarStatus === 'error' && (
            <span className="text-[10px] text-red-600 font-semibold mb-1">{t('profile.avatarUpdatedFailed')}</span>
          )}
          {editingUsername ? (
            <form onSubmit={handleUsernameSave} className="flex items-center gap-1.5 mb-1">
              <input
                type="text"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                maxLength={20}
                required
                autoFocus
                placeholder={t('profile.usernamePlaceholder')}
                aria-label={t('profile.editUsername')}
                className="w-40 text-center text-sm font-semibold border border-brand-dark/20 rounded-full px-3 py-1 bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-300 text-brand-dark font-semibold px-3 py-1.5 rounded-full text-[10px] uppercase cursor-pointer transition-colors"
              >
                {t('profile.saveUsername')}
              </button>
              <button
                type="button"
                onClick={() => setEditingUsername(false)}
                className="bg-brand-light text-brand-dark font-semibold px-3 py-1.5 rounded-full text-[10px] uppercase cursor-pointer transition-colors"
              >
                {t('profile.cancel')}
              </button>
              {usernameError && (
                <span className="text-[10px] text-red-600 font-semibold">{usernameError}</span>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-brand-dark">{userProfile.name}</h2>
              <button
                type="button"
                onClick={startEditUsername}
                className="bg-brand-light hover:bg-amber-100 text-brand-dark rounded-full p-1.5 cursor-pointer transition-colors"
                title={t('profile.editUsername')}
                aria-label={t('profile.editUsername')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {usernameUpdatedMsg && (
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mb-1">
              <Check className="w-3 h-3 stroke-[3]" /> {t('profile.usernameUpdated')}
            </span>
          )}
          <p className="text-xs text-brand-dark/50 font-medium mb-2">{userProfile.email}</p>

          {/* Active Trainer Role Badge */}
          <span className="bg-[#cc0000] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 fill-white" /> {userProfile.role || t('auth.roleNovice')}
          </span>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-5">

          {/* Maps Created Stat */}
          <div>
            <h3 className="text-base font-bold uppercase mb-3 flex items-center gap-2">
              <Map className="w-5 h-5 text-brand-green" /> {t('profile.myCreatedMaps')}
            </h3>
            <div className="bg-brand-light/60 dark:bg-slate-700/60 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-4xl font-bold text-brand-green">{myPublishedMaps.length}</div>
              <div>
                <div className="text-xs font-semibold text-brand-dark/60 uppercase">{t('profile.mapsPublished')}</div>
                <div className="text-[11px] text-brand-dark/50 mt-0.5">
                  {myPublishedMaps.length === 0
                    ? t('profile.noPublishedMaps')
                    : myPublishedMaps.length > 1
                      ? t('profile.publishedCountPlural', { count: myPublishedMaps.length })
                      : t('profile.publishedCount', { count: myPublishedMaps.length })}
                </div>
              </div>
            </div>

            {/* List of published maps */}
            {myPublishedMaps.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {myPublishedMaps.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 bg-brand-light/40 dark:bg-slate-700/40 rounded-xl px-3 py-2 text-xs font-semibold">
                     🗺️ <span className="text-brand-dark truncate min-w-0">{m.title}</span>
                     <span className="ml-auto text-[10px] text-brand-dark/40 font-normal">{m.rarity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Change Trainer Role */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" /> {t('profile.changeRole')}
              </h4>
              {roleUpdatedMsg && (
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> {t('profile.roleUpdated')}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableRoles.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => handleRoleChange(r.name)}
                  className={`p-2.5 rounded-2xl text-left text-[10px] font-semibold uppercase transition-all cursor-pointer flex flex-col justify-between h-14 ${
                    selectedRole === r.name
                      ? 'bg-amber-400 text-brand-dark scale-[1.02]'
                      : 'bg-brand-light/40 dark:bg-slate-700/40 hover:bg-brand-light/80 dark:hover:bg-slate-700/70 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xs">{r.badge}</span>
                  <span className="truncate">{t(r.name)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Admin Command Center (Only for Admins) & Logout */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isAdminLoggedIn && (
              <button
                onClick={() => navigateTo('admin')}
                className="bg-amber-400 hover:bg-amber-300 text-brand-dark font-semibold px-4 py-2.5 rounded-full text-xs flex items-center gap-2 cursor-pointer uppercase transition-colors"
              >
                {t('profile.openCommandCenter')}
              </button>
            )}

            <button
              onClick={logout}
              className="bg-white hover:bg-red-50 text-red-600 font-semibold px-4 py-2.5 rounded-full border border-red-300 text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" /> {t('profile.logoutSession')}
            </button>
          </div>

        </div>
      </div>

      {pendingAvatar && (
        <AvatarCropModal
          file={pendingAvatar}
          onCancel={() => setPendingAvatar(null)}
          onConfirm={handleAvatarCropped}
        />
      )}
    </div>
  );
}
