(function () {
  const translations = {
    fr: {
      eyebrow:'ESPACE DE GESTION · BEN-LEARNING',heroTitle:'Votre tableau de bord',heroDescription:'Gérez vos élèves, centralisez les échanges et publiez vos ressources pédagogiques depuis un espace organisé.',live:'Suivi des inscriptions en direct',quickTitle:'Actions prioritaires',quickStudents:'Valider les inscriptions',quickMessages:'Consulter les messages',quickPlan:'Préparer une séance ou un devoir',
      navOverview:'Vue générale',navStudents:'Inscriptions',navMessages:'Messages',navPedagogy:'Séances & devoirs',navCatalogue:'Catalogue des cours',
      overviewKicker:'PILOTAGE',overviewTitle:'Vue d’ensemble',overviewDescription:'Les indicateurs essentiels de votre plateforme en un coup d’œil.',
      studentsKicker:'INSCRIPTIONS',studentsHeading:'Gestion des élèves',studentsDescription:'Recherchez, filtrez et validez les inscriptions depuis un tableau unique.',backTop:'↑ Indicateurs',
      messagesKicker:'COMMUNICATION',messagesHeading:'Échanges & annonces',messagesDescription:'Traitez les messages et diffusez vos notifications aux élèves.',
      pedagogyKicker:'PÉDAGOGIE',pedagogyHeading:'Planification pédagogique',pedagogyDescription:'Organisez vos séances et les devoirs de chaque groupe.',
      catalogueKicker:'RESSOURCES',catalogueHeading:'Bibliothèque des cours',catalogueDescription:'Ajoutez ou mettez à jour vos supports et retrouvez les cours publiés.'
    },
    ar: {
      eyebrow:'فضاء إدارة BEN-LEARNING',heroTitle:'لوحة التحكم',heroDescription:'أدر التلاميذ، تابع الرسائل وانشر الموارد البيداغوجية من فضاء واحد ومنظّم.',live:'متابعة مباشرة للتسجيلات',quickTitle:'المهام ذات الأولوية',quickStudents:'المصادقة على التسجيلات',quickMessages:'الاطلاع على الرسائل',quickPlan:'إعداد حصة أو واجب',
      navOverview:'نظرة عامة',navStudents:'التسجيلات',navMessages:'الرسائل',navPedagogy:'الحصص والواجبات',navCatalogue:'مكتبة الدروس',
      overviewKicker:'المتابعة',overviewTitle:'نظرة شاملة',overviewDescription:'أهم مؤشرات منصتك في لمحة واحدة.',
      studentsKicker:'التسجيلات',studentsHeading:'إدارة التلاميذ',studentsDescription:'ابحث، صفّ وسجّل الموافقات من جدول واحد.',backTop:'↑ المؤشرات',
      messagesKicker:'التواصل',messagesHeading:'الرسائل والإعلانات',messagesDescription:'تابع الرسائل وأرسل الإشعارات إلى التلاميذ.',
      pedagogyKicker:'البيداغوجيا',pedagogyHeading:'التخطيط البيداغوجي',pedagogyDescription:'نظّم الحصص والواجبات لكل مجموعة.',
      catalogueKicker:'الموارد',catalogueHeading:'مكتبة الدروس',catalogueDescription:'أضف وعدّل مواردك واستعرض الدروس المنشورة.'
    }
  };
  const nav = document.querySelector('.admin-section-nav');
  function updateLang() {
    const lang = localStorage.getItem('bl_lang') === 'ar' ? 'ar' : 'fr';
    document.querySelectorAll('[data-admin-i18n]').forEach(el => { el.textContent = translations[lang][el.dataset.adminI18n] || el.textContent; });
  }
  updateLang();
  window.addEventListener('bl:languagechange',updateLang);
  if (nav && 'IntersectionObserver' in window) {
    const ids = ['admin-overview','admin-students','admin-inbox','admin-pedagogy','admin-catalogue'];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a').forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#'+entry.target.id));
      });
    }, { rootMargin:'-20% 0px -65% 0px', threshold:0 });
    ids.forEach(id => { const el=document.getElementById(id); if (el) observer.observe(el); });
  }
})();
