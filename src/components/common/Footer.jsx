export default function Footer() {
  return (
    <footer className="text-center text-xs text-gray-600 dark:text-slate-300 my-8 space-y-2 font-mono">
      <div className="flex justify-center gap-6 font-bold underline">
        <button className="hover:text-black dark:hover:text-white transition-colors">Legal</button>
        <button className="hover:text-black dark:hover:text-white transition-colors">Support</button>
        <button className="hover:text-black dark:hover:text-white transition-colors">Trainer Club</button>
      </div>
      <p className="text-[11px] font-medium">© 2026 Pocket Odyssey - Gotta Explore 'Em All</p>
    </footer>
  );
}
