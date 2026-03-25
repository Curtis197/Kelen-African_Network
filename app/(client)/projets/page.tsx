import Link from 'next/link';

export default function Page() {
  return (
    <main className="min-h-screen pt-12 pb-24 px-6 md:px-8">
      
<div className="max-w-screen-xl mx-auto">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
<div>
<nav className="flex items-center gap-2 text-xs font-medium text-on-surface-variant mb-3">
<span>Diaspora</span>
<span className="material-symbols-outlined text-[10px]">chevron_right</span>
<span className="text-[#10b77f]">Mes Projets</span>
</nav>
<h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Mes Projets</h1>
<p className="text-on-surface-variant max-w-lg">Gérez vos investissements immobiliers et suivez l'avancement de vos projets en temps réel.</p>
</div>
<div className="flex items-center gap-3">
<button className="p-2.5 bg-surface-container-high rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined">filter_list</span>
</button>
<button className="flex md:hidden items-center gap-2 bg-[#10b77f] text-white px-5 py-2.5 rounded-lg font-semibold text-sm">
<span className="material-symbols-outlined text-lg">add</span>
                        Nouveau
                    </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

<div className="group bg-surface-container-lowest rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-outline-variant/15">
<div className="relative h-48 overflow-hidden">
<img alt="Villa Bamako" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDf9YAl8c10o38ghFRRiHBq5zUvziBQ11LtnXHfbv82pULZ6r8e4V8gEz7SL-SJswZ2FpzaHz3AE8J5OS4do6aQb6GON7SQU6IaFUdbhaGH735GWqtEu9hcC_APiazJWWUtdpnQeLJ1NH8BZmohJsIJR7uJDj_BwaBLS42eB6UzUrgKCho2QL1xv_-RdgH5NR5MIHgxNKoSjqf-UXoxyYwwBSAkIyq3JmJJs-08Db8OKNk3YplqhMr8cOuExbDdfg3fFuU6ta5u3o"/>
<div className="absolute top-4 right-4">
<span className="bg-secondary-container/90 backdrop-blur-md text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                En cours
                            </span>
</div>
</div>
<div className="p-6">
<div className="flex justify-between items-start mb-4">
<div>
<h3 className="text-xl font-bold text-on-surface font-headline">Villa Bamako</h3>
<p className="text-sm text-on-surface-variant">Quartier du Fleuve, Mali</p>
</div>
<button className="text-on-surface-variant hover:text-[#10b77f] transition-colors">
<span className="material-symbols-outlined">more_vert</span>
</button>
</div>
<div className="space-y-4 mb-6">
<div>
<div className="flex justify-between text-xs font-medium mb-1.5">
<span className="text-on-surface-variant uppercase tracking-wider">Budget engagé</span>
<span className="text-on-surface font-bold">65%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-[#10b77f] rounded-full" ></div>
</div>
</div>
<div className="flex items-center gap-4 py-3 px-4 bg-surface-container-low rounded-2xl">
<div className="flex -space-x-2">
<img alt="Team member" className="w-6 h-6 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOmP1Tp-BPaSEBQ6VcTof_6jJfR2l-t4PDIBbEBkaQYtXy7gqyk4Y_d5Agat3ArQMUuNkcLFDi424mjCUPj7-S91Fwjj9masNjL0lfjh2lruqEhmojcAG7t99RTIpSr2YN4hPPhQcqLcyTGW0QQ-iHpxaXLh1H0RYBFerln6AbIdftttP77uqSI7rQA2PVQkv1aVDjtD7KPhDwpiCJ85dinPqjGSmbe7iKWS_6IK92Zp8ELtKG0q7wJ6j0WiDpeZrfTnpc9bD2XJU"/>
<img alt="Team member" className="w-6 h-6 rounded-full border-2 border-white" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaXCpz9VeX7CAvnJtjdM5JMbFTzsbXovfqylCfWqirvAzke3f7b7fC2eYIzH93GsHBS90SrwB1ocMssfzWCoV4lNbpuNYltjWwlH7X1pK5tS_yAvE2Bsb-MplxVkRdqKuYK5nbTl9y4cd-E-1F37QWZ9BieqIQ2BmBZymJPcNE97FZfBhBIa7Uwam4zDh8BS6O2XDYbZswAg-93iTT_orgYrQX9-cd9K0loQnRJQYpdeQchqS9FsZbduUfex3DU9BFlkHDgCDk3jQ"/>
<div className="w-6 h-6 rounded-full border-2 border-white bg-surface-container-highest flex items-center justify-center text-[8px] font-bold">+2</div>
</div>
<div className="h-4 w-px bg-outline-variant/30"></div>
<span className="text-xs font-medium text-on-surface-variant">Prochaine étape: Fondations</span>
</div>
</div>
<button className="w-full py-3 bg-surface-container-high hover:bg-[#10b77f] hover:text-white text-on-surface font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 group/btn">
                            Gérer le projet
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</div>

<div className="group bg-surface-container-lowest rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-outline-variant/15">
<div className="relative h-48 overflow-hidden">
<img alt="Rénovation Abidjan" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-NFfpOYvxy1FDBiq9ra92lwGsTtP-UTT3SVjcv17BxLUNheTyT2qF6TxaJqZd-8h_df7XB26ttSu2yIgAoCLDxeE-Pm-GA213Pdp1XinUsB0OykuTxGEDepimz1Cx9Dprn2fEk1RV3IJw6uqyIi6gBJgSnCmUGqfbyk9aS4xSyA7J05IZewebfTFJhP1iORNeoINfHtTmH6w_Oc5XUPifYbuZNqLiAt22hOPDOrBsbCH1Sets0bHFkIpUd6hjXuhBU5ntuRVFBTI"/>
<div className="absolute top-4 right-4">
<span className="bg-[#10b77f]/10 backdrop-blur-md text-[#10b77f] px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                En préparation
                            </span>
</div>
</div>
<div className="p-6">
<div className="flex justify-between items-start mb-4">
<div>
<h3 className="text-xl font-bold text-on-surface font-headline">Rénovation Abidjan</h3>
<p className="text-sm text-on-surface-variant">Cocody, Côte d'Ivoire</p>
</div>
<button className="text-on-surface-variant hover:text-[#10b77f] transition-colors">
<span className="material-symbols-outlined">more_vert</span>
</button>
</div>
<div className="space-y-4 mb-6">
<div>
<div className="flex justify-between text-xs font-medium mb-1.5">
<span className="text-on-surface-variant uppercase tracking-wider">Budget engagé</span>
<span className="text-on-surface font-bold">12%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-[#10b77f] rounded-full" ></div>
</div>
</div>
<div className="flex items-center gap-4 py-3 px-4 bg-surface-container-low rounded-2xl">
<span className="text-xs font-medium text-on-surface-variant">Attente de validation permis</span>
</div>
</div>
<button className="w-full py-3 bg-surface-container-high hover:bg-[#10b77f] hover:text-white text-on-surface font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 group/btn">
                            Gérer le projet
                            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</div>

<div className="group bg-surface-container-lowest rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] border border-outline-variant/15">
<div className="relative h-48 overflow-hidden">
<img alt="Résidence Dakar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNp-97g0vjGV85vIaJYqHw00pNw8mHNeJh7m29a7As93bHSQBmOZrjKdieUBeaO7hlgathXmuL9ZpGAALnbtrbv5n2KexyqpURoM67T_QshYhrOTo7N-tDkSU3IxUcMS5T-YhRjf3tPpxDSngnOXkZHELsCE_sEJ6a-hxk1U8br6-HOTxHqSnjmFGQTLnb1uSiA16Yb-wmXx9-nH1le8oEj2X-zbrPBPySP_Btyt8tvycEhyyN1k1oOgvzgRi1N56uHNlAwP3qXGM"/>
<div className="absolute top-4 right-4">
<span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                Terminé
                            </span>
</div>
</div>
<div className="p-6">
<div className="flex justify-between items-start mb-4">
<div>
<h3 className="text-xl font-bold text-on-surface font-headline">Résidence Dakar</h3>
<p className="text-sm text-on-surface-variant">Almadies, Sénégal</p>
</div>
<button className="text-on-surface-variant hover:text-[#10b77f] transition-colors">
<span className="material-symbols-outlined">more_vert</span>
</button>
</div>
<div className="space-y-4 mb-6">
<div>
<div className="flex justify-between text-xs font-medium mb-1.5">
<span className="text-on-surface-variant uppercase tracking-wider">Budget engagé</span>
<span className="text-on-surface font-bold">100%</span>
</div>
<div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-[#10b77f] rounded-full" ></div>
</div>
</div>
<div className="flex items-center gap-2 py-2 px-3 bg-[#10b77f]/10 rounded-xl">
<span className="material-symbols-outlined text-[#10b77f] text-sm" >verified</span>
<span className="text-xs font-bold text-[#10b77f]">Livré avec succès</span>
</div>
</div>
<button className="w-full py-3 bg-surface-container-high hover:bg-[#10b77f] hover:text-white text-on-surface font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                            Voir le bilan
                            <span className="material-symbols-outlined text-sm">analytics</span>
</button>
</div>
</div>

<button className="group h-full min-h-[400px] border-2 border-dashed border-outline-variant rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-[#10b77f]/50 hover:bg-[#10b77f]/5 transition-all">
<div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-[#10b77f] group-hover:text-white transition-colors">
<span className="material-symbols-outlined text-3xl">add</span>
</div>
<div className="text-center">
<h3 className="text-lg font-bold text-on-surface font-headline">Nouveau Projet</h3>
<p className="text-xs text-on-surface-variant px-12">Lancez une nouvelle initiative immobilière</p>
</div>
</button>
</div>
</div>

    </main>
  );
}
