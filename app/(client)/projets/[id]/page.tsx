import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      
<div className="max-w-7xl mx-auto px-8 py-8">

<nav className="mb-6 flex items-center gap-2 text-sm font-medium text-stone-500">
<span>Mes Projets</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
<span className="text-primary font-semibold">Villa Bamako</span>
</nav>

<section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
<div className="space-y-2">
<h1 className="text-5xl font-extrabold text-stone-900 tracking-tight font-headline">Villa Bamako</h1>
<div className="flex items-center gap-4">
<div className="relative inline-block">
<select className="appearance-none bg-secondary-container text-on-secondary-container px-4 py-1.5 pr-10 rounded-full font-bold text-xs border-none cursor-pointer focus:ring-2 focus:ring-secondary/50">
<option>En cours</option>
<option>Terminé</option>
<option>En pause</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">expand_more</span>
</div>
<span className="text-stone-400 text-xs font-medium">Dernière mise à jour: il y a 2 jours</span>
</div>
</div>
<button className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
<span className="material-symbols-outlined">add_circle</span>
                    Nouveau compte rendu
                </button>
</section>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

<div className="lg:col-span-2 space-y-8">

<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-stone-200/5 transition-all hover:shadow-md">
<div className="flex items-center justify-between mb-8">
<h3 className="text-xl font-bold text-stone-900 font-headline">Timeline/Phases</h3>
<button className="text-primary text-xs font-bold hover:underline">Voir détails</button>
</div>
<div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-100">

<div className="relative">
<div className="absolute -left-[30px] top-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center z-10">
<span className="material-symbols-outlined text-sm" >check</span>
</div>
<div>
<h4 className="font-bold text-stone-900">Fondations</h4>
<p className="text-sm text-stone-500 mb-2">Terminé le 12 Octobre 2023</p>
<div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-stone-600 rounded-lg text-xs font-semibold">
<span className="material-symbols-outlined text-sm">inventory_2</span> 14 documents
                                    </div>
</div>
</div>

<div className="relative">
<div className="absolute -left-[30px] top-1 w-6 h-6 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center z-10 border-4 border-white">
<span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
</div>
<div>
<h4 className="font-bold text-stone-900">Élévation</h4>
<p className="text-sm text-stone-500 mb-3">En cours • Débuté le 5 Novembre</p>
<div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
<div className="bg-gradient-to-r from-primary to-primary-container h-full w-[45%]"></div>
</div>
<p className="text-[10px] text-primary font-bold mt-2 uppercase">45% complété</p>
</div>
</div>

<div className="relative opacity-50">
<div className="absolute -left-[30px] top-1 w-6 h-6 bg-stone-200 rounded-full flex items-center justify-center z-10 border-4 border-white"></div>
<div>
<h4 className="font-bold text-stone-400">Toiture</h4>
<p className="text-sm text-stone-400">À venir • Estimation Janvier 2024</p>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-stone-200/5">
<h3 className="text-xl font-bold text-stone-900 font-headline mb-6">Professionnels Engagés</h3>
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="p-4 bg-surface-container-low rounded-xl flex items-center gap-4 group hover:bg-surface-container-high transition-colors cursor-pointer">
<div className="relative">
<img alt="Architect" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCSrqvBghr7G1TNExoSUEaPH4Wq6gm_MvGFU--VQ6lr6GpvVpYTSL-tfD_6m3gSfXjZeuD6rhYemmMdUVTeTgaCW80qJHXcx3enTjWeKbeI0zz-hBS1CDIBZpGX3Z1bJ4Lu_mMAY1C4Vg-uNkOiZMw3TGWbdEQ8acFv_zviFHNq6cHyy4fhc72RlK-nir0NvLYClh2uT7LuSwkmSzxXrjRhgTxilNdSgKAN-WQMUtstzyFbHGc24JIy94zihsL23jnPGOluAicENCg"/>
<div className="absolute -bottom-1 -right-1 bg-secondary-container p-1 rounded-full border-2 border-white">
<span className="material-symbols-outlined text-[10px] block" >military_tech</span>
</div>
</div>
<div className="flex-1">
<h5 className="font-bold text-stone-900 text-sm">Moussa Traoré</h5>
<p className="text-xs text-stone-500">Architecte DPLG</p>
<div className="flex gap-2 mt-2">
<span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase">Actif</span>
<span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-[9px] font-bold rounded-full uppercase">Gold</span>
</div>
</div>
<span className="material-symbols-outlined text-stone-300 group-hover:text-stone-900 transition-colors">arrow_forward_ios</span>
</div>

<div className="p-4 bg-surface-container-low rounded-xl flex items-center gap-4 group hover:bg-surface-container-high transition-colors cursor-pointer">
<div className="relative">
<img alt="Contractor" className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSmh5UL7ywIAdJ16V87E2Q_L2uP8OW4ova3IMy-4x4me86BTuNHKjZ1bhMdShziLMAdHBTFjip_HxeKSNSaHMndaAlVv2UxupdbqNQkyUdaEBUKcpYQLD2Wgk3gU6IvP0IwfbG3fcZcnLoEyoCkrsZerVAiQdLnWruK8QkpH-hBCEBpxLPk1rNgcT0gl_wsaDhppFYKrhy-TLVLG1HgxBTv7OKX5txf0o-iISJj7ESCk8WK2_DZs45JbvZNpJj51T95Ortz-50e38"/>
<div className="absolute -bottom-1 -right-1 bg-stone-300 p-1 rounded-full border-2 border-white">
<span className="material-symbols-outlined text-[10px] block" >military_tech</span>
</div>
</div>
<div className="flex-1">
<h5 className="font-bold text-stone-900 text-sm">Bakary Diakité</h5>
<p className="text-xs text-stone-500">Entrepreneur Général</p>
<div className="flex gap-2 mt-2">
<span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase">Actif</span>
<span className="px-2 py-0.5 bg-stone-200 text-stone-600 text-[9px] font-bold rounded-full uppercase">Silver</span>
</div>
</div>
<span className="material-symbols-outlined text-stone-300 group-hover:text-stone-900 transition-colors">arrow_forward_ios</span>
</div>
</div>
</div>
</div>

<div className="space-y-8">

<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-stone-200/5">
<h3 className="text-xl font-bold text-stone-900 font-headline mb-8">Budget Overview</h3>
<div className="flex flex-col items-center">
<div className="relative w-48 h-48 flex items-center justify-center mb-8">
<svg className="w-full h-full transform -rotate-90">
<circle className="text-stone-100" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
<circle className="text-primary transition-all duration-1000 ease-out" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset="193.52" strokeWidth="12"></circle>
</svg>
<div className="absolute flex flex-col items-center">
<span className="text-3xl font-extrabold text-stone-900">65%</span>
<span className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Utilisé</span>
</div>
</div>
<div className="w-full space-y-4">
<div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
<span className="text-xs font-semibold text-stone-500">Total Alloué</span>
<span className="font-bold text-stone-900">150,000,000 CFA</span>
</div>
<div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
<span className="text-xs font-semibold text-emerald-700">Dépensé</span>
<span className="font-bold text-emerald-900">97,500,000 CFA</span>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-stone-200/5">
<div className="flex items-center justify-between mb-6">
<h3 className="text-xl font-bold text-stone-900 font-headline">Documents</h3>
<button className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors">
<span className="material-symbols-outlined text-stone-600 text-sm">filter_list</span>
</button>
</div>
<div className="space-y-3">

<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl group cursor-pointer hover:bg-surface-container-high transition-all">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">picture_as_pdf</span>
</div>
<div>
<h6 className="text-sm font-bold text-stone-800 line-clamp-1">Contrat de construction</h6>
<p className="text-[10px] text-stone-400 uppercase font-bold">PDF • 2.4 MB</p>
</div>
</div>
<button className="text-stone-400 group-hover:text-primary transition-colors">
<span className="material-symbols-outlined">download</span>
</button>
</div>

<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl group cursor-pointer hover:bg-surface-container-high transition-all">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">architecture</span>
</div>
<div>
<h6 className="text-sm font-bold text-stone-800 line-clamp-1">Plans_V3.dwg</h6>
<p className="text-[10px] text-stone-400 uppercase font-bold">CAD • 15.8 MB</p>
</div>
</div>
<button className="text-stone-400 group-hover:text-primary transition-colors">
<span className="material-symbols-outlined">download</span>
</button>
</div>

<div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl group cursor-pointer hover:bg-surface-container-high transition-all">
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">table_view</span>
</div>
<div>
<h6 className="text-sm font-bold text-stone-800 line-clamp-1">Devis Descriptif.xlsx</h6>
<p className="text-[10px] text-stone-400 uppercase font-bold">EXCEL • 1.1 MB</p>
</div>
</div>
<button className="text-stone-400 group-hover:text-primary transition-colors">
<span className="material-symbols-outlined">download</span>
</button>
</div>
</div>
<button className="w-full mt-6 py-3 text-stone-500 text-sm font-bold bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
                            Voir tout les fichiers
                        </button>
</div>
</div>
</div>
</div>

    </main>
  );
}
