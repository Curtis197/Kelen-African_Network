import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      
<div className="max-w-6xl mx-auto">

<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
<div>
<nav className="flex items-center gap-2 text-outline text-xs font-semibold uppercase tracking-widest mb-3">
<span>Platforme</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
<span className="text-primary">Favoris</span>
</nav>
<h1 className="text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">Professionnels sauvegardés</h1>
<p className="text-on-surface-variant max-w-lg">Gérez votre réseau de confiance et suivez l'avancement de vos collaborations prioritaires.</p>
</div>

<div className="relative w-full md:w-80 group">
<div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
<span className="material-symbols-outlined">search</span>
</div>
<input className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all placeholder:text-outline/60 text-sm" placeholder="Rechercher par nom ou métier..." type="text"/>
</div>
</header>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

<article className="group relative bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/10">
<button className="absolute top-4 right-4 z-10 p-2 bg-surface-container-low/50 backdrop-blur-sm rounded-full text-error hover:scale-110 active:scale-95 transition-all">
<span className="material-symbols-outlined" >favorite</span>
</button>
<div className="mb-4 aspect-video rounded-xl overflow-hidden bg-surface-container">
<img alt="Construction project" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUFeImlLKa8sDDQwzOG5lzYrIpvH59O-f7RVYLTp8TkFWvuo09MeUGMrBzFhpHyU114N9H37Jy_KfhSLE0Q7z_2BtT_fPWHReCkhNScKZKvne4U6LQqh3ed5ua06zUZKpf37OI8MetxkJ5Ej5SqcU--z9BajhBOzJ_sA_fMkjwErNIeh-rAb-bOQj8K6fecaB2GIIW1jMG9yGWjGZjeTR0b-_mA9nnjpO_juk846PFHEZAqwyKkwlsM_KqQilPGjQFoPD_UbPTPjE"/>
</div>
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">Or Certifié</span>
</div>
<div>
<h3 className="text-lg font-bold text-on-surface leading-tight">Kouassi Construction</h3>
<p className="text-primary text-sm font-semibold">Gros Oeuvre &amp; Maçonnerie</p>
</div>
<div className="flex items-center gap-2 text-on-surface-variant text-sm border-t border-outline-variant/10 pt-4">
<span className="material-symbols-outlined text-base">location_on</span>
<span>Dakar, Sénégal</span>
</div>
</div>
</article>

<article className="group relative bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/10">
<button className="absolute top-4 right-4 z-10 p-2 bg-surface-container-low/50 backdrop-blur-sm rounded-full text-error hover:scale-110 active:scale-95 transition-all">
<span className="material-symbols-outlined" >favorite</span>
</button>
<div className="mb-4 aspect-video rounded-xl overflow-hidden bg-surface-container">
<img alt="Electrical services" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYbB9L57TUSbba-RTZ6ov4HbKuSQEyhS8eRonDMGUotGEoQP92h9NarbRRIARquc5vyH0fuvLjnXlXQ1jZkfhoYJtkwD5Z-tXkw-5c_V7GcWfTxyMOxI6Hh5Nx4bYzmpqNPN7cK-dTkGpFEb2mlCUPrCAGUfuuqBtuYJyH0zdchTn5y8YCMiyssbDcTvRlMSPkwApQ81VjVW8bhMehyVVEGSVEgEc6H4Vg1gA-xFI6sd44XiU-u8s_3gRdj6kjxsuTwF2sqexK7_M"/>
</div>
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded-full">Argent</span>
</div>
<div>
<h3 className="text-lg font-bold text-on-surface leading-tight">Diallo Énergie</h3>
<p className="text-primary text-sm font-semibold">Installations Photovoltaïques</p>
</div>
<div className="flex items-center gap-2 text-on-surface-variant text-sm border-t border-outline-variant/10 pt-4">
<span className="material-symbols-outlined text-base">location_on</span>
<span>Abidjan, Côte d'Ivoire</span>
</div>
</div>
</article>

<article className="group relative bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/10">
<button className="absolute top-4 right-4 z-10 p-2 bg-surface-container-low/50 backdrop-blur-sm rounded-full text-error hover:scale-110 active:scale-95 transition-all">
<span className="material-symbols-outlined" >favorite</span>
</button>
<div className="mb-4 aspect-video rounded-xl overflow-hidden bg-surface-container">
<img alt="Architect desk" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-6We1IWjZJS40nNFqt3Xn0gYPdMNokOHA6oWI0ld46Nd3O5TTQETzPxJz4Sa4jTHiYpXVYbN2X_hi3UP0GDfVDUXALZ2ALhQkj6ccXjRGlq-QXIUun9upYiFZpOOcSbHaVl0bcNeOFSAKOE31JK3o3I1B4kbooO_fSniCj3MuyV95RBDXrT0SeZvRMfaVRxhSJYyAdpejhgK7ErsOh2aDks_jAHNVoL1P0zzOBAqAoJsodQZZiV6kM9Vha2e0mDJvt0U0vP6hMKY"/>
</div>
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded-full">Or Certifié</span>
</div>
<div>
<h3 className="text-lg font-bold text-on-surface leading-tight">Atelier Mensah</h3>
<p className="text-primary text-sm font-semibold">Architecture &amp; Design Intérieur</p>
</div>
<div className="flex items-center gap-2 text-on-surface-variant text-sm border-t border-outline-variant/10 pt-4">
<span className="material-symbols-outlined text-base">location_on</span>
<span>Lomé, Togo</span>
</div>
</div>
</article>

<article className="group relative bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-outline-variant/10">
<button className="absolute top-4 right-4 z-10 p-2 bg-surface-container-low/50 backdrop-blur-sm rounded-full text-error hover:scale-110 active:scale-95 transition-all">
<span className="material-symbols-outlined" >favorite</span>
</button>
<div className="mb-4 aspect-video rounded-xl overflow-hidden bg-surface-container">
<img alt="Plumbing infrastructure" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLluHrTOMLKLJIy0jYywluqYqvW68VMpoJ8PkAaFC75wJt7JOtTNkYxdby6X0AwgLN502solgM0zFiA0BgviHgJtvZObCvtJ9Zw6e8PRe5x-ohayVGHvOgqCApwOl0bsii-n-dS4eZDL_AIbXiGGcg72nIrf9Ev-QfdzY-UYDd65kW2GHdU0Q2RMMtTPw23e1ziKXFxALnR-gHEdjgl4SigYQhaJ537od2Ju2a9Dsyg8yPH9dyODP2o0-DAJvUHMdei5oZhK7DNgg"/>
</div>
<div className="space-y-3">
<div className="flex items-center justify-between">
<span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded-full">Vérifié</span>
</div>
<div>
<h3 className="text-lg font-bold text-on-surface leading-tight">Gaye Plomberie Pro</h3>
<p className="text-primary text-sm font-semibold">Génie Sanitaire</p>
</div>
<div className="flex items-center gap-2 text-on-surface-variant text-sm border-t border-outline-variant/10 pt-4">
<span className="material-symbols-outlined text-base">location_on</span>
<span>Saint-Louis, Sénégal</span>
</div>
</div>
</article>
</div>

<div className="hidden flex flex-col items-center justify-center py-24 text-center">
<div className="w-48 h-48 mb-8 bg-surface-container-low rounded-full flex items-center justify-center">
<span className="material-symbols-outlined text-7xl text-outline-variant">person_search</span>
</div>
<h2 className="text-2xl font-bold text-on-surface mb-2">Aucun favori pour le moment</h2>
<p className="text-on-surface-variant mb-8 max-w-sm mx-auto">Commencez par explorer nos professionnels certifiés pour bâtir votre équipe de projet.</p>
<Link className="px-8 py-4 bg-primary text-white rounded-xl font-bold Manrope shadow-lg hover:shadow-primary/20 transition-all active:scale-95" href="/">
                    Découvrir des professionnels
                </Link>
</div>

<section className="mt-20 p-8 bg-surface-container-low rounded-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-outline-variant/10">
<div className="flex flex-col gap-2">
<h4 className="text-xl font-bold Manrope text-on-surface">Besoin d'un expert spécifique ?</h4>
<p className="text-on-surface-variant">Notre réseau s'agrandit chaque jour avec les meilleurs talents locaux.</p>
</div>
<button className="whitespace-nowrap px-6 py-3 bg-surface-container-lowest text-primary font-bold rounded-xl shadow-sm hover:bg-white transition-all border border-primary/10">
                    Utiliser la recherche avancée
                </button>
</section>
</div>

    </main>
  );
}
