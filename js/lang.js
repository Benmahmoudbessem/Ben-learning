(function(){
  const STORAGE_KEY = 'bl_lang';
  const defaultLang = localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'fr';

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const i18n = {
    common: {
      fr: { languageLabel: 'Langue', french: 'Français', arabic: 'العربية', brandAdmin: 'Ben-Learning Admin' },
      ar: { languageLabel: 'اللغة', french: 'Français', arabic: 'العربية', brandAdmin: 'إدارة Ben-Learning' }
    },
    'index.html': {
      fr: {
        title: 'SmartEducation | Ben-Learning',
        description: "Ben-Learning, plateforme gratuite d'apprentissage de l'informatique pour les élèves du lycée tunisien.",
        htmlDir: 'ltr',
        ops: [
          ['#mainNav a[href="index.html"]','Accueil'],['#mainNav a[href="courses.html"]','Cours'],['#mainNav a[href="sessions.html"]','Séances'],['#mainNav a[href="homework.html"]','Devoirs'],['#mainNav a[href="assistant.html"]','Assistant'],['#mainNav a[href="profile.html"]','Mon espace'],
          ['.hero-badge','Ben-Learning connecté à SmartTeacher'],['.hero-copy h1','Apprends l’informatique '],['.hero-copy h1 .gradient-text','autrement.'],['.hero-lead','Une plateforme moderne pour réviser, pratiquer et progresser de la <strong>1ère année</strong> jusqu’au <strong>Bac</strong>, avec des cours structurés, des séances Google Meet, des devoirs, des quiz et un suivi personnalisé.','html'],['.hero-actions .btn.primary span','Explorer les cours'],['.hero-actions .btn.secondary','Créer un compte gratuit'],['#heroInstallBtn','📲 Installer sur smartphone'],
          ['.hero-trust .trust-item:nth-child(1)','Gratuit'],['.hero-trust .trust-item:nth-child(2)','Accessible partout'],['.hero-trust .trust-item:nth-child(3)','Progression suivie'],
          ['.learning-label','Espace d’apprentissage'],['.free-pill','EN LIGNE'],['.learning-stat:nth-child(1) b','Cours organisés'],['.learning-stat:nth-child(1) small','Par niveau et section'],['.learning-stat:nth-child(2) b','Quiz interactifs'],['.learning-stat:nth-child(2) small','Résultat immédiat'],
          ['.update-kicker','PLATEFORME EN ÉVOLUTION'],['.update-banner-copy h2','🔄 Ben-Learning est en mise à jour continue'],['.update-banner-copy p','Les cours préparés dans SmartTeacher sont publiés directement ici, selon ton niveau et ta section.'],['.update-live','Contenu actualisé'],
          ['.home-stats .home-stat:nth-child(1) span','Niveaux'],['.home-stats .home-stat:nth-child(2) span','Sections'],['.home-stats .home-stat:nth-child(3) span','Gratuit'],['.home-stats .home-stat:nth-child(4) span','Accessible'],
          ['.gallery-badge:nth-of-type(1)','Éducation & Formation'],['.gallery-badge:nth-of-type(2)','Classe interactive'],['.gallery-badge:nth-of-type(3)','Apprentissage actif'],['.gallery-badge:nth-of-type(4)','Learning numérique'],
          ['.levels-section .section-heading .eyebrow','Parcours scolaire'],['.levels-section .section-heading h2','Choisis ton niveau et commence à progresser'],['.levels-section .section-heading p','Des ressources organisées pour accompagner les élèves à chaque étape du lycée.'],
          ['.level-group:nth-of-type(1) .level-description','Découvrir les bases du numérique et développer les premiers réflexes logiques.'],['.level-group:nth-of-type(1) .level-link','Voir les cours '],
          ['.level-group:nth-of-type(2) .level-description','Renforcer les acquis avec des contenus adaptés aux différentes sections.'],['.level-group:nth-of-type(2) .level-link','Voir les cours '],
          ['.level-group:nth-of-type(3) .level-description','Approfondir les notions et préparer efficacement l’année du Bac.'],['.level-group:nth-of-type(3) .level-link','Voir les cours '],
          ['.level-group:nth-of-type(4) .level-description','Réviser, s’entraîner et consolider les compétences essentielles avant l’examen.'],['.level-group:nth-of-type(4) .level-link','Voir les cours '],
          ['.feature-section-modern .section-heading .eyebrow','Une expérience complète'],['.feature-section-modern .section-heading h2','Tout ce qu’il faut pour mieux apprendre'],['.feature-section-modern .section-heading p','Une interface claire, des contenus structurés et un suivi personnel dans un seul espace.'],
          ['.modern-feature-card:nth-of-type(1) .feature-kicker','APPRENDRE'],['.modern-feature-card:nth-of-type(1) h3','Cours structurés'],['.modern-feature-card:nth-of-type(1) p','Niveau → Section → Trimestre → Domaine → Chapitre : retrouve rapidement la bonne ressource.'],
          ['.modern-feature-card:nth-of-type(2) .feature-kicker','S’ENTRAÎNER'],['.modern-feature-card:nth-of-type(2) h3','Quiz interactifs'],['.modern-feature-card:nth-of-type(2) p','Teste tes connaissances, obtiens ton score immédiatement et identifie ce qu’il faut revoir.'],
          ['.modern-feature-card:nth-of-type(3) .feature-kicker','PROGRESSER'],['.modern-feature-card:nth-of-type(3) h3','Suivi personnel'],['.modern-feature-card:nth-of-type(3) p','Consulte tes activités et tes résultats depuis ton espace étudiant sécurisé.'],
          ['.v4-showcase-section .section-heading .eyebrow','Ben-Learning V4.1'],['.v4-showcase-section .section-heading h2','Une plateforme pédagogique plus complète'],['.v4-showcase-section .section-heading p','Cours, séances en ligne, devoirs, assistant pédagogique et installation sur smartphone dans un seul espace.'],
          ['.v4-showcase-card:nth-of-type(1) h3','Planning & Google Meet'],['.v4-showcase-card:nth-of-type(1) p','Consulte les séances correspondant à ton parcours et rejoins le Meet au bon moment.'],['.v4-showcase-card:nth-of-type(1) b','Voir le planning →'],
          ['.v4-showcase-card:nth-of-type(2) h3','Devoirs & corrections'],['.v4-showcase-card:nth-of-type(2) p','Retrouve les travaux à rendre, envoie ta réponse et consulte la note/commentaire.'],['.v4-showcase-card:nth-of-type(2) b','Voir mes devoirs →'],
          ['.v4-showcase-card:nth-of-type(3) h3','Assistant pédagogique'],['.v4-showcase-card:nth-of-type(3) p','Reçois des recommandations basées sur ton niveau, ta progression, tes quiz et ton planning.'],['.v4-showcase-card:nth-of-type(3) b','Ouvrir l’assistant →'],
          ['.v4-showcase-card:nth-of-type(4) h3','Installable sur smartphone'],['.v4-showcase-card:nth-of-type(4) p','Ben-Learning est une PWA : sur les navigateurs compatibles, installe-la comme une application.'],
          ['.creator-signature span','Enseignant en informatique & ingénieur génie logiciel'],['.creator-eyebrow','À propos du créateur'],['.creator-copy h2','Une plateforme éducative conçue avec passion'],
          ['.creator-copy p:nth-of-type(1)','Je suis <strong>Bessem Ben Mahmoud</strong>, <strong>enseignant en informatique et ingénieur en génie logiciel</strong>. J’ai conçu et développé <strong>Ben-Learning</strong> pour offrir un espace éducatif gratuit, structuré et interactif afin d’aider les élèves à comprendre l’informatique, réviser leurs cours, réaliser des exercices et tester leurs acquis plus facilement.','html'],
          ['.creator-copy p:nth-of-type(2)','Je continue à faire évoluer la plateforme en ajoutant régulièrement des contenus et des ressources selon l’avancement des cours et des séances, en m’appuyant sur mon expérience dans l’enseignement et dans le génie logiciel.','html'],
          ['.creator-values span:nth-of-type(1)','🎓 Apprentissage structuré'],['.creator-values span:nth-of-type(2)','💻 Apprentissage numérique'],['.creator-values span:nth-of-type(3)','🚀 Développement continu'],
          ['.contact-section .section-heading .eyebrow','Séances en ligne'],['.contact-section .section-heading h2','Besoin d’accompagnement ? Contacte-moi'],['.contact-section .section-heading p','Des séances à distance peuvent être organisées sur Google Meet. Envoie ta demande par email ou WhatsApp pour fixer un rendez-vous.'],['.contact-card:nth-of-type(1) p','Écris-moi pour les cours, questions ou réservations.'],['.contact-card:nth-of-type(2) p','Message rapide pour demander une séance en ligne.'],['.contact-card:nth-of-type(3) strong','Réserver une séance'],['.contact-card:nth-of-type(3) p','Indique ton niveau, ta section et tes disponibilités.'],
          ['.cta-label','Prêt à commencer ?'],['.home-cta h2','Ton espace d’apprentissage t’attend.'],['.home-cta p','Crée gratuitement ton compte et accède aux cours et quiz Ben-Learning.'],['.cta-button','Créer mon compte '],
          ['.site-footer div p','Apprendre aujourd’hui, réussir demain.'],['.footer-links a:nth-of-type(1)','Accueil'],['.footer-links a:nth-of-type(2)','Contact'],['.footer-links a:nth-of-type(3)','Connexion'],['.footer-links a:nth-of-type(4)','Administration']
        ]
      },
      ar: {
        title: 'SmartEducation | Ben-Learning',
        description: 'Ben-Learning منصة مجانية لتعلّم الإعلامية لتلاميذ المرحلة الثانوية في تونس.',
        htmlDir: 'rtl',
        ops: [
          ['#mainNav a[href="index.html"]','الرئيسية'],['#mainNav a[href="courses.html"]','الدروس'],['#mainNav a[href="sessions.html"]','الحصص'],['#mainNav a[href="homework.html"]','الواجبات'],['#mainNav a[href="assistant.html"]','المساعد'],['#mainNav a[href="profile.html"]','فضائي'],
          ['.hero-badge','Ben-Learning مرتبط بـ SmartTeacher'],['.hero-copy h1','تعلّم الإعلامية '],['.hero-copy h1 .gradient-text','بطريقة مختلفة.'],['.hero-lead','منصّة حديثة للمراجعة والتطبيق والتقدّم من <strong>السنة الأولى</strong> إلى <strong>البكالوريا</strong>، مع دروس منظّمة، حصص Google Meet، واجبات، اختبارات ومتابعة شخصية.','html'],['.hero-actions .btn.primary span','استكشاف الدروس'],['.hero-actions .btn.secondary','إنشاء حساب مجاني'],['#heroInstallBtn','📲 ثبّت على الهاتف'],
          ['.hero-trust .trust-item:nth-child(1)','مجاني'],['.hero-trust .trust-item:nth-child(2)','متاح من أي مكان'],['.hero-trust .trust-item:nth-child(3)','متابعة التقدّم'],
          ['.learning-label','فضاء التعلّم'],['.free-pill','عبر الإنترنت'],['.learning-stat:nth-child(1) b','دروس منظّمة'],['.learning-stat:nth-child(1) small','حسب المستوى والشعبة'],['.learning-stat:nth-child(2) b','اختبارات تفاعلية'],['.learning-stat:nth-child(2) small','نتيجة فورية'],
          ['.update-kicker','منصة تتطوّر باستمرار'],['.update-banner-copy h2','🔄 Ben-Learning في تحديث مستمر'],['.update-banner-copy p','يتم نشر الدروس المحضّرة في SmartTeacher هنا مباشرة حسب مستواك وشعبتك.'],['.update-live','محتوى محدّث'],
          ['.home-stats .home-stat:nth-child(1) span','مستويات'],['.home-stats .home-stat:nth-child(2) span','شُعب'],['.home-stats .home-stat:nth-child(3) span','مجاني'],['.home-stats .home-stat:nth-child(4) span','متاح'],
          ['.gallery-badge:nth-of-type(1)','التربية والتكوين'],['.gallery-badge:nth-of-type(2)','قسم تفاعلي'],['.gallery-badge:nth-of-type(3)','تعلّم نشيط'],['.gallery-badge:nth-of-type(4)','تعلّم رقمي'],
          ['.levels-section .section-heading .eyebrow','المسار الدراسي'],['.levels-section .section-heading h2','اختر مستواك وابدأ التقدّم'],['.levels-section .section-heading p','موارد منظّمة لمرافقة التلاميذ في كل مرحلة من مراحل الدراسة الثانوية.'],
          ['.level-group:nth-of-type(1) .level-description','اكتشاف أساسيات العالم الرقمي وتطوير أولى المهارات المنطقية.'],['.level-group:nth-of-type(1) .level-link','عرض الدروس '],
          ['.level-group:nth-of-type(2) .level-description','تعزيز المكتسبات بمحتويات مناسبة لمختلف الشعب.'],['.level-group:nth-of-type(2) .level-link','عرض الدروس '],
          ['.level-group:nth-of-type(3) .level-description','تعميق المفاهيم والاستعداد الجيد لسنة البكالوريا.'],['.level-group:nth-of-type(3) .level-link','عرض الدروس '],
          ['.level-group:nth-of-type(4) .level-description','مراجعة وتدريب وتثبيت الكفاءات الأساسية قبل الامتحان.'],['.level-group:nth-of-type(4) .level-link','عرض الدروس '],
          ['.feature-section-modern .section-heading .eyebrow','تجربة متكاملة'],['.feature-section-modern .section-heading h2','كل ما تحتاجه لتتعلّم بشكل أفضل'],['.feature-section-modern .section-heading p','واجهة واضحة، محتوى منظم، ومتابعة شخصية في فضاء واحد.'],
          ['.modern-feature-card:nth-of-type(1) .feature-kicker','تعلّم'],['.modern-feature-card:nth-of-type(1) h3','دروس منظّمة'],['.modern-feature-card:nth-of-type(1) p','المستوى → الشعبة → الثلاثي → المجال → الفصل: اعثر بسرعة على المورد المناسب.'],
          ['.modern-feature-card:nth-of-type(2) .feature-kicker','تدرّب'],['.modern-feature-card:nth-of-type(2) h3','اختبارات تفاعلية'],['.modern-feature-card:nth-of-type(2) p','اختبر معلوماتك، احصل على نتيجتك فوراً وحدد ما يجب مراجعته.'],
          ['.modern-feature-card:nth-of-type(3) .feature-kicker','تقدّم'],['.modern-feature-card:nth-of-type(3) h3','متابعة شخصية'],['.modern-feature-card:nth-of-type(3) p','اطلع على أنشطتك ونتائجك من فضائك الدراسي الآمن.'],
          ['.v4-showcase-section .section-heading .eyebrow','Ben-Learning V4.1'],['.v4-showcase-section .section-heading h2','منصة بيداغوجية أكثر تكاملاً'],['.v4-showcase-section .section-heading p','دروس، حصص مباشرة، واجبات، مساعد بيداغوجي وتثبيت على الهاتف في فضاء واحد.'],
          ['.v4-showcase-card:nth-of-type(1) h3','البرنامج وGoogle Meet'],['.v4-showcase-card:nth-of-type(1) p','اطلع على الحصص الموافقة لمسارك وانضم إلى Meet في الوقت المناسب.'],['.v4-showcase-card:nth-of-type(1) b','عرض البرنامج →'],
          ['.v4-showcase-card:nth-of-type(2) h3','الواجبات والإصلاح'],['.v4-showcase-card:nth-of-type(2) p','اطلع على الأعمال المطلوبة، أرسل إجابتك وشاهد الملاحظة والتعليق.'],['.v4-showcase-card:nth-of-type(2) b','عرض واجباتي →'],
          ['.v4-showcase-card:nth-of-type(3) h3','المساعد البيداغوجي'],['.v4-showcase-card:nth-of-type(3) p','احصل على توصيات حسب مستواك، تقدّمك، اختباراتك وبرنامجك.'],['.v4-showcase-card:nth-of-type(3) b','فتح المساعد →'],
          ['.v4-showcase-card:nth-of-type(4) h3','قابلة للتثبيت على الهاتف'],['.v4-showcase-card:nth-of-type(4) p','Ben-Learning تطبيق ويب تقدمي PWA: على المتصفحات المتوافقة يمكنك تثبيته كتطبيق.'],
          ['.creator-signature span','أستاذ إعلامية ومهندس برمجيات'],['.creator-eyebrow','عن صاحب المنصة'],['.creator-copy h2','منصة تعليمية صنعتها بحبّ للتعلّم والتطوّر'],
          ['.creator-copy p:nth-of-type(1)','أنا <strong>باسّم بن محمود</strong>، <strong>أستاذ إعلامية ومهندس في هندسة البرمجيات</strong>. قمت بتصميم وتطوير <strong>Ben-Learning</strong> بهدف توفير فضاء تعليمي مجاني، منظّم وتفاعلي يساعد التلاميذ على فهم الإعلامية، مراجعة الدروس، إنجاز التمارين واختبار مكتسباتهم بسهولة أكبر.','html'],
          ['.creator-copy p:nth-of-type(2)','أواصل تطوير المنصّة باستمرار بإضافة محتويات وموارد جديدة حسب تقدّم الدروس والحصص، مستفيداً من خبرتي في التدريس وهندسة البرمجيات.','html'],
          ['.creator-values span:nth-of-type(1)','🎓 تعليم منظّم'],['.creator-values span:nth-of-type(2)','💻 تعلّم رقمي'],['.creator-values span:nth-of-type(3)','🚀 تطوير مستمر'],
          ['.contact-section .section-heading .eyebrow','حصص عن بعد'],['.contact-section .section-heading h2','بحاجة إلى مرافقة؟ تواصل معي'],['.contact-section .section-heading p','يمكن تنظيم حصص عن بعد عبر Google Meet. أرسل طلبك عبر البريد الإلكتروني أو واتساب لتحديد موعد.'],['.contact-card:nth-of-type(1) p','اكتب لي بخصوص الدروس أو الأسئلة أو الحجوزات.'],['.contact-card:nth-of-type(2) p','رسالة سريعة لطلب حصة عبر الإنترنت.'],['.contact-card:nth-of-type(3) strong','احجز حصة'],['.contact-card:nth-of-type(3) p','اذكر مستواك، شعبتك وأوقات فراغك.'],
          ['.cta-label','جاهز للانطلاق؟'],['.home-cta h2','فضاء التعلّم الخاص بك بانتظارك.'],['.home-cta p','أنشئ حسابك مجاناً وادخل إلى دروس واختبارات Ben-Learning.'],['.cta-button','إنشاء حسابي '],
          ['.site-footer div p','تعلّم اليوم، تنجح غداً.'],['.footer-links a:nth-of-type(1)','الرئيسية'],['.footer-links a:nth-of-type(2)','اتصال'],['.footer-links a:nth-of-type(3)','دخول'],['.footer-links a:nth-of-type(4)','الإدارة']
        ]
      }
    },
    'login.html': {
      fr: { title: 'Ben-Learning | Connexion', htmlDir:'ltr', ops:[['#mainNav a[href="index.html"]','Accueil'],['#mainNav a[href="register.html"]','Inscription'],['.auth-card .eyebrow','Bon retour'],['.auth-card h1','Connexion étudiant'],['.auth-card p','Connecte-toi avec ton adresse vérifiée. Si ton email n’est pas encore confirmé, Ben-Learning te guidera pour terminer la vérification.'],['label[for], #loginForm label:nth-of-type(1)','Email'],['#loginEmail','nom@email.com','placeholder'],['#loginForm label:nth-of-type(2)','Mot de passe'],['#loginPassword','••••••••','placeholder'],['#loginForm button','Se connecter'],['.auth-switch','Pas encore inscrit ? '],['.auth-switch a','Créer un compte']] },
      ar: { title: 'Ben-Learning | تسجيل الدخول', htmlDir:'rtl', ops:[['#mainNav a[href="index.html"]','الرئيسية'],['#mainNav a[href="register.html"]','التسجيل'],['.auth-card .eyebrow','مرحباً بعودتك'],['.auth-card h1','دخول التلميذ'],['.auth-card p','سجّل الدخول باستعمال بريدك المتحقق. إذا لم يتم تأكيد بريدك بعد فسيرشدك Ben-Learning لإتمام التحقق.'],['#loginForm label:nth-of-type(1)','البريد الإلكتروني'],['#loginEmail','name@email.com','placeholder'],['#loginForm label:nth-of-type(2)','كلمة المرور'],['#loginPassword','••••••••','placeholder'],['#loginForm button','تسجيل الدخول'],['.auth-switch','ليس لديك حساب بعد؟ '],['.auth-switch a','إنشاء حساب']] }
    },
    'register.html': {
      fr: { title:'Ben-Learning | Inscription', htmlDir:'ltr', ops:[['#mainNav a[href="index.html"]','Accueil'],['#mainNav a[href="login.html"]','Connexion'],['.auth-card .eyebrow','Bienvenue'],['.auth-card h1','Créer un compte'],['.auth-card p','Crée ton compte avec une adresse email réelle. Un lien de vérification te sera envoyé avant que l’administrateur puisse accepter ton inscription.'],['#registerForm label:nth-of-type(1)','Nom complet'],['#name','Nom et prénom','placeholder'],['#registerForm label:nth-of-type(2)','Email valide'],['#email','nom@email.com','placeholder'],['.field-help','Tu devras ouvrir cet email et cliquer sur le lien de vérification Firebase.'],['#registerForm label:nth-of-type(3)','Niveau'],['#studentLevel option[value=""]','Choisir un niveau'],['#registerForm label:nth-of-type(4)','Section'],['#studentSection option[value=""]','Choisir une section'],['#registerForm label:nth-of-type(5)','Mot de passe'],['#password','6 caractères minimum','placeholder'],['#registerForm button','Envoyer ma demande d’inscription'],['.auth-switch','Déjà inscrit ? '],['.auth-switch a','Se connecter']] },
      ar: { title:'Ben-Learning | التسجيل', htmlDir:'rtl', ops:[['#mainNav a[href="index.html"]','الرئيسية'],['#mainNav a[href="login.html"]','تسجيل الدخول'],['.auth-card .eyebrow','مرحباً'],['.auth-card h1','إنشاء حساب'],['.auth-card p','أنشئ حسابك ببريد إلكتروني حقيقي. سيتم إرسال رابط تحقق قبل أن تتمكن الإدارة من قبول تسجيلك.'],['#registerForm label:nth-of-type(1)','الاسم الكامل'],['#name','الاسم واللقب','placeholder'],['#registerForm label:nth-of-type(2)','بريد إلكتروني صالح'],['#email','name@email.com','placeholder'],['.field-help','يجب فتح هذا البريد والضغط على رابط التحقق الخاص بـ Firebase.'],['#registerForm label:nth-of-type(3)','المستوى'],['#studentLevel option[value=""]','اختر مستوى'],['#registerForm label:nth-of-type(4)','الشعبة'],['#studentSection option[value=""]','اختر شعبة'],['#registerForm label:nth-of-type(5)','كلمة المرور'],['#password','6 أحرف على الأقل','placeholder'],['#registerForm button','إرسال طلب التسجيل'],['.auth-switch','لديك حساب بالفعل؟ '],['.auth-switch a','تسجيل الدخول']] }
    },
    'status.html': {
      fr: { title:'Ben-Learning | Vérification et inscription', htmlDir:'ltr', ops:[['#mainNav a[href="index.html"]','Accueil'],['#statusLogoutBtn','Déconnexion'],['#statusBadge','Email à vérifier'],['.status-greeting','Bonjour '],['.status-email','Adresse : '],['#statusTitle','Vérifie ton adresse email'],['#statusText','Un email de vérification doit être confirmé avant que l’administration puisse accepter ton inscription.'],['#stepAccount b','Compte créé'],['#stepAccount small','Ton inscription Firebase est enregistrée.'],['#stepEmail b','Email vérifié'],['#stepEmail small','Confirme que cette adresse t’appartient.'],['#stepAdmin b','Validation Admin'],['#stepAdmin small','L’administration vérifie ta demande.'],['#stepAccess b','Accès complet'],['#stepAccess small','Cours, quiz, devoirs et séances.'],['.verification-info strong','📬 Regarde aussi dans Spam / Courrier indésirable'],['.verification-info span','Le message est envoyé par Firebase Authentication.'],['#checkVerificationBtn','✅ J’ai vérifié mon email'],['#resendVerificationBtn','📨 Renvoyer l’email'],['#verifiedContactActions a:nth-of-type(1)','💬 Contacter l’administration'],['#verifiedContactActions a:nth-of-type(2)','🔔 Voir mes notifications'],['#approvedActions a','Accéder à mon espace →']] },
      ar: { title:'Ben-Learning | التحقق والتسجيل', htmlDir:'rtl', ops:[['#mainNav a[href="index.html"]','الرئيسية'],['#statusLogoutBtn','تسجيل الخروج'],['#statusBadge','التحقق من البريد'],['.status-greeting','مرحباً '],['.status-email','العنوان: '],['#statusTitle','تحقق من بريدك الإلكتروني'],['#statusText','يجب تأكيد بريد التحقق قبل أن تتمكن الإدارة من قبول تسجيلك.'],['#stepAccount b','تم إنشاء الحساب'],['#stepAccount small','تم تسجيلك في Firebase.'],['#stepEmail b','تم التحقق من البريد'],['#stepEmail small','أكد أن هذا العنوان يخصك.'],['#stepAdmin b','موافقة الإدارة'],['#stepAdmin small','تقوم الإدارة بمراجعة طلبك.'],['#stepAccess b','وصول كامل'],['#stepAccess small','دروس، اختبارات، واجبات وحصص.'],['.verification-info strong','📬 تفقد أيضاً الرسائل غير المرغوب فيها'],['.verification-info span','يتم إرسال الرسالة بواسطة Firebase Authentication.'],['#checkVerificationBtn','✅ لقد تحققت من بريدي الإلكتروني'],['#resendVerificationBtn','📨 إعادة إرسال البريد'],['#verifiedContactActions a:nth-of-type(1)','💬 التواصل مع الإدارة'],['#verifiedContactActions a:nth-of-type(2)','🔔 عرض إشعاراتي'],['#approvedActions a','الدخول إلى فضائي →']] }
    },
    'admin.html': {
      fr: { title:'Ben-Learning | Dashboard Admin', htmlDir:'ltr', ops:[['.brand-text','Ben-Learning'],['#mainNav a[href="index.html"]','Voir le site'],['#adminLogoutBtn','Déconnexion'],['.section-heading.left .eyebrow','Administration'],['.section-heading.left h1','Tableau de bord'],['.section-heading.left p','Valide les inscriptions, échange avec les élèves, envoie des notifications et gère les cours.'],['.admin-stat-card:nth-of-type(1) small','Élèves inscrits'],['.admin-stat-card:nth-of-type(2) small','En attente'],['.admin-stat-card:nth-of-type(3) small','Messages non lus'],['.admin-stat-card:nth-of-type(4) small','Cours ajoutés'],['.admin-stat-card:nth-of-type(5) small','Séances'],['.admin-stat-card:nth-of-type(6) small','Devoirs'],['.admin-students-panel h2','👥 Validation des inscriptions'],['.admin-students-panel .panel-subtitle','Chaque nouveau compte doit d’abord vérifier son adresse email. Le bouton Accepter reste bloqué tant que l’email n’est pas confirmé.'],['#studentSearch','🔍 Rechercher par nom, email, niveau, section ou statut…','placeholder'],['.student-table thead th:nth-of-type(4)','Vérification email']] },
      ar: { title:'Ben-Learning | لوحة الإدارة', htmlDir:'rtl', ops:[['.brand-text','Ben-Learning'],['#mainNav a[href="index.html"]','عرض الموقع'],['#adminLogoutBtn','تسجيل الخروج'],['.section-heading.left .eyebrow','الإدارة'],['.section-heading.left h1','لوحة التحكم'],['.section-heading.left p','صادق على التسجيلات، تواصل مع التلاميذ، أرسل إشعارات وقم بإدارة الدروس.'],['.admin-stat-card:nth-of-type(1) small','التلاميذ المسجلون'],['.admin-stat-card:nth-of-type(2) small','قيد الانتظار'],['.admin-stat-card:nth-of-type(3) small','رسائل غير مقروءة'],['.admin-stat-card:nth-of-type(4) small','الدروس المضافة'],['.admin-stat-card:nth-of-type(5) small','الحصص'],['.admin-stat-card:nth-of-type(6) small','الواجبات'],['.admin-students-panel h2','👥 المصادقة على التسجيلات'],['.admin-students-panel .panel-subtitle','يجب على كل حساب جديد التحقق أولاً من بريده الإلكتروني. يبقى زر القبول معطلاً ما دام البريد غير مؤكد.'],['#studentSearch','🔍 ابحث بالاسم أو البريد أو المستوى أو الشعبة أو الحالة…','placeholder'],['.student-table thead th:nth-of-type(4)','التحقق من البريد']] }
    }
  };


  const extraArabic = {
    'admin-login.html': [
      ['.auth-card .eyebrow','الإدارة'],['.auth-card h1','دخول المشرف'],
      ['.auth-card>p','سجّل الدخول باستعمال حساب Firebase الذي يحمل صلاحية الإدارة في Firestore.'],
      ['#adminLoginForm button[type="submit"]','دخول المشرف']
    ],
    'courses.html': [
      ['main .section-heading .eyebrow','Ben-Learning مرتبط بـ SmartTeacher'],
      ['main h1','📚 دروسي ومواردي'],['#studentScopeText','جارٍ تحميل مسارك الدراسي…'],
      ['#emptyState h3','لا توجد دروس'],['#emptyState p','جرّب كلمة بحث أو مرشحاً آخر.']
    ],
    'quiz.html': [
      ['main .eyebrow','اختبر معلوماتك'],['main h1','📝 اختبارات حسب المجال'],
      ['main .section-heading p','تظهر الاختبارات حسب مستواك وشعبتك وتُحتسب نتيجتك تلقائياً.'],
      ['button[type="submit"]','تأكيد الاختبار']
    ],
    'chat.html': [
      ['main .eyebrow','المساعدة'],['main h1','💬 محادثة مع الإدارة'],
      ['main .section-heading p','اطرح سؤالاً حول تسجيلك أو الدروس أو المنصة.'],
      ['#chatForm button[type="submit"]','إرسال']
    ],
    'notifications.html': [
      ['main .eyebrow','مركز الإشعارات'],['main h1','🔔 إشعاراتي'],
      ['main .section-heading p','اعثر هنا على حالة تسجيلك والإعلانات والرسائل الجديدة من الإدارة.'],
      ['#markAllRead','وضع علامة مقروء على الكل']
    ],
    'assistant.html': [
      ['main .eyebrow','المساعد البيداغوجي الذكي'],['main h1','🤖 المساعد البيداغوجي'],
      ['main .section-heading p','مساعد مخصص حسب مستواك وتقدمك ونتائج اختباراتك وبرنامجك.'],
      ['.ai-context h2','معلوماتي'],
      ['.ai-quick-actions button:nth-child(1)','ماذا أراجع؟'],
      ['.ai-quick-actions button:nth-child(2)','درسي القادم'],
      ['.ai-quick-actions button:nth-child(3)','واجباتي'],
      ['.ai-quick-actions button:nth-child(4)','الحصة القادمة'],
      ['.ai-quick-actions button:nth-child(5)','برنامج مراجعة']
    ],
    'homework.html': [
      ['main .eyebrow','الواجبات'],['main h1','📝 واجباتي'],
      ['main .section-heading p','اطلع على المواضيع والآجال وأرسل إجابتك كنص أو كرابط Google Drive أو GitHub.']
    ],
    'sessions.html': [
      ['main .eyebrow','البرنامج البيداغوجي'],['main h1','📅 حصصي عبر الإنترنت'],
      ['main .section-heading p','اطلع على حصص مستواك وشعبتك وانضم إلى جلسات Google Meet.'],
      ['button[data-filter="upcoming"]','القادمة'],['button[data-filter="all"]','الكل']
    ],
    'profile.html': [
      ['.dashboard-eyebrow','لوحة التحكم الشخصية'],
      ['.progress-overview-copy .eyebrow','مساري الدراسي'],
      ['.progress-overview-copy h2','واصل التقدّم على راحتك'],
      ['.continue-card .eyebrow','تابع التعلم'],
      ['.dashboard-v4-glance article:nth-child(1) h2','الحصة القادمة'],
      ['.dashboard-v4-glance article:nth-child(2) h2','الواجب القادم'],
      ['.my-courses-panel h2','دروسي'],
      ['.dashboard-bottom-grid section:nth-child(1) h2','تاريخ الاختبارات'],
      ['.dashboard-bottom-grid section:nth-child(2) h2','النشاط الأخير']
    ],
    'admin.html': [
      ['.admin-students-panel h2','👥 المصادقة على التسجيلات'],
      ['.admin-message-inbox-panel h2','🔔 رسائل جديدة'],
      ['.admin-chat-panel h2','💬 محادثات التلاميذ'],
      ['.admin-notification-panel h2','🔔 إرسال إشعار'],
      ['#formTitle','إضافة درس'],
      ['#sessionForm button[type="submit"]','حفظ الحصة'],
      ['#homeworkForm button[type="submit"]','حفظ الواجب'],
      ['.admin-layout .panel:nth-child(2) h2','الدروس المضافة من الإدارة'],
      ['.student-table th:nth-child(1)','التلميذ'],
      ['.student-table th:nth-child(2)','المستوى'],
      ['.student-table th:nth-child(3)','الشعبة'],
      ['.student-table th:nth-child(5)','الحالة'],
      ['.student-table th:nth-child(6)','التسجيل'],
      ['.student-table th:nth-child(7)','الإجراءات']
    ]
  };
  // Cache original static text for returning to French without refreshing.
  const originalSecondaryText = new WeakMap();
  function applySecondaryLanguage(lang) {
    const entries = extraArabic[page] || [];
    for (const [selector, arabic] of entries) {
      document.querySelectorAll(selector).forEach(element => {
        if (!originalSecondaryText.has(element)) originalSecondaryText.set(element, element.textContent);
        element.textContent = lang === 'ar' ? arabic : originalSecondaryText.get(element);
      });
    }
  }

  function setContent(selector, value, mode) {
    document.querySelectorAll(selector).forEach(el => {
      if (mode === 'placeholder') {
        el.setAttribute('placeholder', value);
        return;
      }
      if (mode === 'html') {
        el.innerHTML = value;
        return;
      }
      if (el.childElementCount > 0) {
        const textNode = [...el.childNodes].find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = value;
          return;
        }
      }
      el.textContent = value;
    });
  }

  function applyLanguage(lang) {
    const pageMap = i18n[page];
    const payload = pageMap ? pageMap[lang] : null;
    const common = i18n.common[lang] || i18n.common.fr;
    localStorage.setItem(STORAGE_KEY, lang);

    document.documentElement.lang = lang === 'ar' ? 'ar' : 'fr';
    document.documentElement.dir = payload?.htmlDir || (lang === 'ar' ? 'rtl' : 'ltr');
    document.body.classList.toggle('lang-ar', lang === 'ar');
    const creator = document.querySelector('.creator-copy');
    if (creator) { creator.dir = lang === 'ar' ? 'rtl' : 'ltr'; creator.lang = lang; }

    if (payload?.title) document.title = payload.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && payload?.description) desc.setAttribute('content', payload.description);

    (payload?.ops || []).forEach(([selector, value, mode]) => setContent(selector, value, mode));
    applySecondaryLanguage(lang);
    // Shared navigation on secondary pages; dynamic content remains managed by its module.
    if (!pageMap) {
      const links = {
        'index.html':['Accueil','الرئيسية'], 'courses.html':['Cours','الدروس'],
        'sessions.html':['Séances','الحصص'], 'homework.html':['Devoirs','الواجبات'],
        'quiz.html':['Quiz','اختبارات'], 'assistant.html':['Assistant','المساعد'],
        'profile.html':['Mon espace','فضائي'], 'login.html':['Connexion','دخول'],
        'register.html':['Inscription','التسجيل'], 'status.html':['Mon inscription','حالة التسجيل'],
        'notifications.html':['Notifications','الإشعارات'], 'chat.html':['Chat','المحادثة']
      };
      document.querySelectorAll('#mainNav a').forEach(link => {
        const key = (link.getAttribute('href') || '').split('?')[0];
        if (key in links && !link.id) link.textContent = links[key][lang === 'ar' ? 1 : 0];
      });
    }


    const selector = document.getElementById('siteLanguage');
    if (selector) {
      selector.value = lang;
      selector.setAttribute('aria-label', common.languageLabel);
      selector.title = common.languageLabel;
    }
    const menu = document.getElementById('menuBtn');
    if (menu && !document.getElementById('mainNav')?.classList.contains('open')) {
      menu.setAttribute('aria-label', lang === 'ar' ? 'فتح القائمة' : 'Ouvrir le menu');
    }
    // The active session link is controlled by app.js; never overwrite its label.
    const authLink = document.getElementById('authLink');
    if (authLink && authLink.href.includes('status.html')) authLink.textContent = lang === 'ar' ? 'متابعة التسجيل' : 'Suivi inscription';
    else if (authLink && authLink.href.includes('profile.html')) authLink.textContent = lang === 'ar' ? 'فضائي' : 'Mon espace';

    window.dispatchEvent(new CustomEvent('bl:languagechange', { detail: { lang } }));
  }

  function createSwitcher() {
    const header = document.getElementById('siteHeader');
    const brand = header?.querySelector('.brand');
    if (!header || !brand || header.querySelector('.header-preferences')) return;
    const wrap = document.createElement('div');
    wrap.className = 'header-preferences';
    wrap.innerHTML = `
      <label class="lang-switcher" for="siteLanguage">
        <span aria-hidden="true" class="lang-globe">◎</span>
        <select id="siteLanguage" aria-label="Langue" title="Langue">
          <option value="fr">FR</option>
          <option value="ar">العربية</option>
        </select>
      </label>
      <button id="siteThemeToggle" class="theme-toggle" type="button" aria-label="Activer le mode sombre" title="Mode sombre">
        <span class="theme-toggle-icon" aria-hidden="true">☾</span>
      </button>`;
    brand.after(wrap);
    wrap.querySelector('select').addEventListener('change', (e) => applyLanguage(e.target.value));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createSwitcher(); applyLanguage(defaultLang); });
  } else {
    createSwitcher();
    applyLanguage(defaultLang);
  }
})();
