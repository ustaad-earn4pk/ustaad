# ============================================================
# FILE: backend/ai/curriculum.py
# Hardcoded curriculum — NO Claude API calls
# Tracks match existing course_track enum:
#   computer_basics, web_fundamentals, ghl_developer,
#   integration_expert, full_stack_automation, client_hunting
# ============================================================

CURRICULUM = {

    "computer_basics": {
        "title": "Computer & Internet Basics",
        "track": "computer_basics",
        "level": 1,
        "duration_days": 30,
        "price_pkr": 5000,
        "weeks": [
            {
                "week": 1,
                "title": "Computer Basics",
                "lessons": [
                    {"order": 1, "title": "Computer aur Laptop ka Taaruf", "type": "watch_it", "content": "Computer kya hota hai, parts kaun se hain. Desktop vs Laptop. Power on/off, restart. Mouse aur keyboard use karna."},
                    {"order": 2, "title": "Windows Basic Use", "type": "type_it", "content": "Desktop, taskbar, start menu. Files aur folders banana, rename, delete. Copy paste shortcuts: Ctrl+C, Ctrl+V, Ctrl+Z."},
                    {"order": 3, "title": "Typing Practice", "type": "energy", "content": "Keyboard layout. Touch typing basics. Numbers, symbols. Shift, Caps Lock, Backspace."},
                ],
                "quiz": {
                    "title": "Computer Basics Quiz",
                    "questions": [
                        {"q": "Copy karne ka shortcut?", "options": ["Ctrl+V", "Ctrl+C", "Ctrl+X", "Ctrl+Z"], "answer": 1},
                        {"q": "File delete hone ke baad kahan jaati hai?", "options": ["Internet", "Recycle Bin", "Downloads", "Desktop"], "answer": 1},
                        {"q": "Paste karne ka shortcut?", "options": ["Ctrl+C", "Ctrl+X", "Ctrl+V", "Ctrl+P"], "answer": 2},
                        {"q": "Undo ka shortcut?", "options": ["Ctrl+Y", "Ctrl+Z", "Ctrl+U", "Ctrl+A"], "answer": 1},
                        {"q": "Naya folder banana — right click ke baad?", "options": ["Open", "New > Folder", "Delete", "Rename"], "answer": 1},
                    ]
                },
                "task": None
            },
            {
                "week": 2,
                "title": "Internet & Email",
                "lessons": [
                    {"order": 4, "title": "Internet kya hai?", "type": "watch_it", "content": "Internet ka concept. WiFi aur mobile data. Browser kya hota hai — Chrome, Firefox. URL, tabs, bookmarks."},
                    {"order": 5, "title": "Google Search karna", "type": "do_it", "content": "Sahi keywords use karna. Search filters. Images, News, Videos tabs. Site-specific search."},
                    {"order": 6, "title": "Gmail Account Setup", "type": "do_it", "content": "Gmail account banana. Inbox, Sent, Drafts. Email likhna, subject, to, cc, bcc. Attachment bhejana."},
                ],
                "quiz": {
                    "title": "Internet & Email Quiz",
                    "questions": [
                        {"q": "URL kya hota hai?", "options": ["Email address", "Website address", "Password", "Username"], "answer": 1},
                        {"q": "Gmail kis company ka hai?", "options": ["Microsoft", "Apple", "Google", "Facebook"], "answer": 2},
                        {"q": "Email mein CC matlab?", "options": ["Carbon Copy", "Computer Copy", "Create Copy", "Cancel Copy"], "answer": 0},
                        {"q": "Naya browser tab shortcut?", "options": ["Ctrl+N", "Ctrl+T", "Ctrl+W", "Ctrl+Tab"], "answer": 1},
                        {"q": "Attachment kya hota hai?", "options": ["Subject line", "Email body", "File jo email ke saath bhejein", "Reply button"], "answer": 2},
                    ]
                },
                "task": {
                    "title": "Gmail Account Setup Task",
                    "type": "do_it",
                    "day": "wednesday",
                    "description": "Apna Gmail account banao aur USTAAD ko email bhejo.",
                    "guidelines": [
                        "gmail.com pe jao aur naya account banao",
                        "Apna poora naam use karo email address mein",
                        "Profile picture lagao",
                        "ustaad.earn4pk@gmail.com pe email bhejo — Subject: 'Mera Pehla Email'",
                        "Email body mein apna naam aur sheher likho",
                        "Inbox ka screenshot bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 50
                }
            },
            {
                "week": 3,
                "title": "Google Drive & Docs",
                "lessons": [
                    {"order": 7, "title": "Google Drive kya hai?", "type": "watch_it", "content": "Cloud storage concept. 15GB free. Files upload, folders banana. Share karna."},
                    {"order": 8, "title": "Google Docs & Sheets", "type": "build_it", "content": "Google Docs mein document banana. Text formatting. Google Sheets basics. File download — PDF, Word."},
                ],
                "quiz": {
                    "title": "Google Drive Quiz",
                    "questions": [
                        {"q": "Google Drive free storage?", "options": ["5GB", "10GB", "15GB", "20GB"], "answer": 2},
                        {"q": "Cloud storage matlab?", "options": ["Computer mein", "Internet pe", "USB mein", "CD mein"], "answer": 1},
                        {"q": "Google Docs kya hai?", "options": ["Email service", "Online word processor", "Video player", "Image editor"], "answer": 1},
                        {"q": "PDF mein save karna?", "options": ["Edit > Save", "File > Download > PDF", "View > PDF", "Insert > PDF"], "answer": 1},
                        {"q": "File share karne ke liye?", "options": ["File delete", "Right click > Share", "File print", "File rename"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Google Drive Setup",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Google Drive mein USTAAD folder banao aur document share karo.",
                    "guidelines": [
                        "drive.google.com pe jao",
                        "'USTAAD Course' naam ka folder banao",
                        "Andar 'Week 3 Task' naam ka Google Doc banao",
                        "Doc mein apna naam, sheher, aur GHL se kya seekhna chahte ho likho",
                        "Doc ko ustaad.earn4pk@gmail.com ke saath share karo (Editor access)",
                        "Screenshot bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 60
                }
            },
            {
                "week": 4,
                "title": "Professional Tools",
                "lessons": [
                    {"order": 9, "title": "Zoom & Google Meet", "type": "watch_it", "content": "Video call concept. Zoom account. Meeting join, screen share. Professional call etiquette."},
                    {"order": 10, "title": "WhatsApp Business", "type": "do_it", "content": "WhatsApp Business account. Business profile. Quick replies. Professional messaging."},
                ],
                "quiz": {
                    "title": "Professional Tools Quiz",
                    "questions": [
                        {"q": "Screen share se dusra kya dekh sakta hai?", "options": ["Sirf camera", "Aapki screen", "Sirf audio", "Kuch nahi"], "answer": 1},
                        {"q": "WhatsApp Business extra feature?", "options": ["Koi farq nahi", "Business profile aur catalog", "Video call nahi hoti", "Groups nahi banta"], "answer": 1},
                        {"q": "Professional call mein zaroori?", "options": ["Loud music", "Clean background aur proper dressing", "Khana khate rehna", "Phone pe baat"], "answer": 1},
                        {"q": "Zoom join ke liye?", "options": ["Sirf email", "Meeting ID ya link", "Password sirf", "Credit card"], "answer": 1},
                        {"q": "Quick reply kya hai WA Business mein?", "options": ["Auto response for common questions", "Block karna", "Story banana", "Group banana"], "answer": 0},
                    ]
                },
                "task": {
                    "title": "Final Computer Basics Task",
                    "type": "build_it",
                    "day": "friday",
                    "description": "Complete professional setup karo.",
                    "guidelines": [
                        "Gmail profile picture aur cover lagao",
                        "Google Drive mein organized folders banao",
                        "WhatsApp Business account banao",
                        "Business name: 'Tumhara Naam — GHL Expert'",
                        "Business description likho",
                        "Teeno ke screenshots bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 100
                }
            }
        ]
    },

    "web_fundamentals": {
        "title": "Web & Business Basics",
        "track": "web_fundamentals",
        "level": 2,
        "duration_days": 30,
        "price_pkr": 5000,
        "weeks": [
            {
                "week": 1,
                "title": "Domain & Hosting",
                "lessons": [
                    {"order": 1, "title": "Domain kya hota hai?", "type": "watch_it", "content": "Domain naam — website ka address. .com, .pk, .net. Domain register karna — Namecheap, GoDaddy. $10-15/year."},
                    {"order": 2, "title": "Hosting kya hoti hai?", "type": "watch_it", "content": "Server concept. Shared vs VPS vs Dedicated. Hostinger, SiteGround. cPanel basics."},
                    {"order": 3, "title": "DNS kya hote hain?", "type": "type_it", "content": "DNS — Domain Name System. A Record, CNAME, MX Record, TXT Record. Domain ko hosting se connect karna. Nameservers. Cloudflare."},
                ],
                "quiz": {
                    "title": "Domain & Hosting Quiz",
                    "questions": [
                        {"q": "Domain register matlab?", "options": ["Website design", "Domain naam apne naam karna", "Email banana", "Hosting kharidna"], "answer": 1},
                        {"q": "DNS propagation time?", "options": ["5 minutes", "1 hour", "24-48 hours", "1 week"], "answer": 2},
                        {"q": "A Record kya karta hai?", "options": ["Email route", "Domain ko IP se connect", "SSL lagata hai", "Domain transfer"], "answer": 1},
                        {"q": "MX Record kaam?", "options": ["Website hosting", "Email routing", "SSL certificate", "Domain privacy"], "answer": 1},
                        {"q": "Shared hosting matlab?", "options": ["Ek server pe aap akele", "Ek server pe kai websites", "Apna server", "Cloud server"], "answer": 1},
                    ]
                },
                "task": None
            },
            {
                "week": 2,
                "title": "Email Domain Setup",
                "lessons": [
                    {"order": 4, "title": "Professional Email kyun?", "type": "watch_it", "content": "name@company.com vs Gmail. Client impression. Google Workspace vs Zoho Mail. Email business value."},
                    {"order": 5, "title": "Zoho Mail Setup", "type": "do_it", "content": "Zoho Mail free business email. Domain verify — TXT record. MX records. Email client configure. Email signature."},
                ],
                "quiz": {
                    "title": "Email Domain Quiz",
                    "questions": [
                        {"q": "Professional email kyun?", "options": ["Free hoti hai", "Clients pe professional impression", "Zyada storage", "Fast hoti hai"], "answer": 1},
                        {"q": "Domain verify ke liye?", "options": ["A Record", "MX Record", "TXT Record", "CNAME"], "answer": 2},
                        {"q": "Email signature mein kya?", "options": ["Sirf naam", "Naam, designation, company, contact, website", "Sirf phone", "Sirf email"], "answer": 1},
                        {"q": "Google Workspace cost?", "options": ["Free", "$1/month", "$6/month per user", "$50/month"], "answer": 2},
                        {"q": "MX Record delete se?", "options": ["Website band", "Emails receive nahi hongi", "SSL band", "Domain expire"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Business Email Setup",
                    "type": "do_it",
                    "day": "wednesday",
                    "description": "Zoho Mail mein business email set karo.",
                    "guidelines": [
                        "zoho.com/mail pe jao — free plan",
                        "Domain add karo",
                        "TXT record DNS mein add karo",
                        "MX records set karo",
                        "yourname@yourdomain.com banana",
                        "Email signature set karo",
                        "Phone mein configure karo",
                        "Test email bhejo — screenshot share karo"
                    ],
                    "submission_format": "screenshot",
                    "points": 80
                }
            },
            {
                "week": 3,
                "title": "WordPress Basics",
                "lessons": [
                    {"order": 6, "title": "WordPress kya hai?", "type": "watch_it", "content": "CMS concept. WordPress.org vs .com. 40% websites pe. Theme, Plugin, Page concept. Admin dashboard."},
                    {"order": 7, "title": "WordPress Install", "type": "do_it", "content": "Hosting mein 1-click install. Dashboard — Posts, Pages, Media, Plugins, Appearance. Astra theme. Basic page banana."},
                    {"order": 8, "title": "Essential Plugins", "type": "build_it", "content": "Elementor page builder. Yoast SEO. WPForms. UpdraftPlus backup. Plugin install/activate/deactivate."},
                ],
                "quiz": {
                    "title": "WordPress Quiz",
                    "questions": [
                        {"q": "WordPress kya hai?", "options": ["Email service", "CMS", "Domain provider", "Hosting company"], "answer": 1},
                        {"q": "Plugin ka kaam?", "options": ["Theme change", "Extra functionality add", "Domain change", "Hosting change"], "answer": 1},
                        {"q": "Elementor kya hai?", "options": ["SEO plugin", "Page builder", "Security plugin", "Backup plugin"], "answer": 1},
                        {"q": "WordPress admin URL?", "options": ["site.com/login", "site.com/wp-admin", "site.com/admin", "site.com/dashboard"], "answer": 1},
                        {"q": "Theme vs Plugin farq?", "options": ["Koi farq nahi", "Theme design, Plugin functionality", "Plugin design, Theme functionality", "Dono ek hain"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "WordPress Site Setup",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Basic WordPress website set karo.",
                    "guidelines": [
                        "Hosting mein WordPress install karo",
                        "Astra theme install karo",
                        "Pages banao: Home, About, Services, Contact",
                        "Elementor se Home page design — naam, photo, ek line description",
                        "Contact page pe WPForms contact form lagao",
                        "Website URL + screenshots share karo"
                    ],
                    "submission_format": "url_and_screenshot",
                    "points": 100
                }
            },
            {
                "week": 4,
                "title": "Lead & Funnel Concepts",
                "lessons": [
                    {"order": 9, "title": "Lead kya hoti hai?", "type": "watch_it", "content": "Lead — potential customer. Lead generation. Lead qualify — MQL vs SQL. Lead nurturing. CRM tracking."},
                    {"order": 10, "title": "Funnel kya hota hai?", "type": "watch_it", "content": "Sales funnel — TOFU, MOFU, BOFU. Landing page vs Website. Opt-in page. Thank you page. Email sequence. GHL mein funnel."},
                ],
                "quiz": {
                    "title": "Lead & Funnel Quiz",
                    "questions": [
                        {"q": "Lead kya hai?", "options": ["Paid customer", "Potential interested customer", "Employee", "Competitor"], "answer": 1},
                        {"q": "TOFU matlab?", "options": ["Top of Funnel — awareness", "Type of Funnel", "Total of Funnel", "Track of Funnel"], "answer": 0},
                        {"q": "Landing page maqsad?", "options": ["Blog dikhana", "Specific action karwana", "Company history", "Products list"], "answer": 1},
                        {"q": "Lead nurturing matlab?", "options": ["Lead delete", "Follow up aur relationship banana", "Lead ignore", "Lead sell"], "answer": 1},
                        {"q": "CRM poora naam?", "options": ["Customer Revenue Management", "Customer Relationship Management", "Content Resource Management", "Client Record Management"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Web Basics Final Task",
                    "type": "build_it",
                    "day": "friday",
                    "description": "Complete mini-business setup karo.",
                    "guidelines": [
                        "Domain register karo (ya existing)",
                        "Business email set karo",
                        "WordPress Services page update karo — GHL services list",
                        "Lead capture form banao — name, email, phone, need",
                        "Form WordPress pe lagao",
                        "Test karo — form submit, email receive",
                        "Screenshots + website URL share karo"
                    ],
                    "submission_format": "url_and_screenshot",
                    "points": 120
                }
            }
        ]
    },

    "ghl_developer": {
        "title": "GoHighLevel Developer",
        "track": "ghl_developer",
        "level": 3,
        "duration_days": 45,
        "price_pkr": 7000,
        "weeks": [
            {
                "week": 1,
                "title": "GHL ka Taaruf",
                "lessons": [
                    {"order": 1, "title": "GoHighLevel kya hai?", "type": "watch_it", "content": "GHL all-in-one marketing platform. CRM + Funnels + Automation + Email + SMS + Calendar. Agency model. $97-$497/month value. Pakistani freelancers ke liye opportunity."},
                    {"order": 2, "title": "GHL Dashboard", "type": "watch_it", "content": "Agency account vs Sub-account. Left sidebar. Dashboard metrics. Settings. User management."},
                ],
                "quiz": {
                    "title": "GHL Intro Quiz",
                    "questions": [
                        {"q": "GHL sub-account kya hai?", "options": ["Agency ka account", "Ek client ka account", "Employee ka account", "Test account"], "answer": 1},
                        {"q": "GHL starting price?", "options": ["$10/month", "$49/month", "$97/month", "$500/month"], "answer": 2},
                        {"q": "GHL kya replace kar sakta hai?", "options": ["Sirf email", "CRM + Funnels + Automation + Email + SMS + Calendar", "Sirf website", "Sirf calendar"], "answer": 1},
                        {"q": "Agency model GHL mein?", "options": ["Ek client ek account", "Ek account mein multiple clients", "Multiple accounts ek client", "Koi client nahi"], "answer": 1},
                        {"q": "GHL kis cheez ke liye famous?", "options": ["Video editing", "All-in-one marketing + CRM", "Accounting", "HR management"], "answer": 1},
                    ]
                },
                "task": None
            },
            {
                "week": 2,
                "title": "CRM — Contacts & Pipelines",
                "lessons": [
                    {"order": 3, "title": "GHL CRM — Contacts", "type": "do_it", "content": "Contacts section. Add karna — manually, CSV import. Fields — naam, email, phone, tags, notes. Smart lists. Activity history."},
                    {"order": 4, "title": "Pipelines aur Stages", "type": "build_it", "content": "Pipeline — sales process visualize. Stages — New Lead, Contacted, Qualified, Proposal, Won, Lost. Multiple pipelines."},
                ],
                "quiz": {
                    "title": "CRM Quiz",
                    "questions": [
                        {"q": "Pipeline maqsad?", "options": ["Email bhejana", "Sales process track karna", "Website banana", "Invoice banana"], "answer": 1},
                        {"q": "Tag kya hai GHL mein?", "options": ["Contact label/category", "Email subject", "Pipeline naam", "Stage naam"], "answer": 0},
                        {"q": "Smart list kab?", "options": ["Ek contact dekhna", "Filtered group of contacts", "Pipeline banana", "Email bhejni"], "answer": 1},
                        {"q": "Contact import kaise?", "options": ["Sirf manually", "CSV file se", "Sirf phone se", "Email se"], "answer": 1},
                        {"q": "'Won' stage matlab?", "options": ["Lead lost", "Deal close — client ban gaya", "Lead new", "Proposal bheja"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "CRM Setup",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "GHL CRM setup karo.",
                    "guidelines": [
                        "GHL sub-account mein Contacts section",
                        "5 fake contacts manually add karo",
                        "Tags banao: 'Hot Lead', 'Cold Lead', 'Client'",
                        "3 contacts ko 'Hot Lead' tag lagao",
                        "Pipeline banao: 'GHL Services Pipeline'",
                        "Stages: New Lead → Contacted → Demo → Proposal → Won → Lost",
                        "2 contacts different stages mein move karo",
                        "Screenshots share karo"
                    ],
                    "submission_format": "screenshot",
                    "points": 80
                }
            },
            {
                "week": 3,
                "title": "Conversations & Templates",
                "lessons": [
                    {"order": 5, "title": "Conversations Tab", "type": "watch_it", "content": "Unified inbox — SMS, Email, Facebook, Instagram. Contact conversation history. Manual message bhejana. Assign conversations."},
                    {"order": 6, "title": "Email & SMS Templates", "type": "build_it", "content": "Email template banana. SMS template. Personalization tokens — {{contact.name}}. Template library. HTML vs plain text. SMS 160 char limit."},
                ],
                "quiz": {
                    "title": "Communication Quiz",
                    "questions": [
                        {"q": "Conversations tab mein kya?", "options": ["Sirf emails", "SMS + Email + Social sab", "Sirf SMS", "Sirf social"], "answer": 1},
                        {"q": "{{contact.name}} kya karta hai?", "options": ["Contact delete", "Naam automatically insert", "New contact add", "Contact update"], "answer": 1},
                        {"q": "SMS character limit?", "options": ["100", "140", "160", "200"], "answer": 2},
                        {"q": "HTML email kab?", "options": ["Plain text chahiye", "Formatted designed email", "SMS bhejni", "Attachment"], "answer": 1},
                        {"q": "Conversation assign matlab?", "options": ["Delete karna", "Team member ko handle karne dena", "Archive karna", "Copy karna"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Templates Setup",
                    "type": "build_it",
                    "day": "wednesday",
                    "description": "Email aur SMS templates banao.",
                    "guidelines": [
                        "GHL: Marketing > Emails > Templates",
                        "'Welcome Email' template banao",
                        "Subject: 'Welcome {{contact.first_name}}!'",
                        "Body mein personalization use karo",
                        "SMS template banao: 'Hi {{contact.first_name}}, appointment confirm!'",
                        "Test contact ko email bhejo",
                        "Screenshots share karo"
                    ],
                    "submission_format": "screenshot",
                    "points": 80
                }
            },
            {
                "week": 4,
                "title": "Forms & Calendars",
                "lessons": [
                    {"order": 7, "title": "Forms kya hain?", "type": "watch_it", "content": "Form vs Survey. GHL mein form use — landing page, funnel, website. Lead capture. Fields — name, email, phone, custom. Notifications, redirect."},
                    {"order": 8, "title": "Form Builder", "type": "do_it", "content": "Form builder. Drag and drop fields. Required fields. Styling. Notifications. Embed karna. Submissions CRM mein."},
                    {"order": 9, "title": "Calendar Setup", "type": "do_it", "content": "Appointment booking. Calendar types — Round Robin, Event, Class. Time slots. Buffer time. Confirmation SMS/email. Calendar link."},
                ],
                "quiz": {
                    "title": "Forms & Calendars Quiz",
                    "questions": [
                        {"q": "Form submission kahan save?", "options": ["Email mein", "CRM Contacts mein", "Calendar mein", "Pipeline mein"], "answer": 1},
                        {"q": "Round Robin calendar kab?", "options": ["Ek person ke liye", "Multiple team mein distribute", "Group events", "Webinar"], "answer": 1},
                        {"q": "Form notification matlab?", "options": ["Form delete", "Submit pe email/SMS aaye", "Form update", "Monthly report"], "answer": 1},
                        {"q": "Buffer time kya?", "options": ["Meeting se pehle", "Appointments ke beech gap", "Lunch break", "Weekend"], "answer": 1},
                        {"q": "Form embed matlab?", "options": ["Form delete", "Website/funnel pe lagana", "Form share", "Form print"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Forms & Calendar Task",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Lead capture form aur appointment calendar banao.",
                    "guidelines": [
                        "GHL: Sites > Forms",
                        "'Free Consultation Form' banao — Name, Email, Phone, Service (dropdown)",
                        "Notification — apni email pe",
                        "Thank you: 'Shukriya! 24 ghante mein contact karein ge'",
                        "Calendar: 'Free GHL Consultation'",
                        "Mon-Fri, 10am-6pm, 30 min slots",
                        "Confirmation SMS set karo",
                        "Form submit + calendar booking test karo",
                        "Screenshots bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 100
                }
            },
            {
                "week": 5,
                "title": "Workflows & Automation",
                "lessons": [
                    {"order": 10, "title": "Workflow kya hai?", "type": "watch_it", "content": "Automation — kaam automatically ho. Trigger — kaunsi event pe chale. Action — kya kare. IF/ELSE. Wait steps. Example: lead aaye toh email jaye."},
                    {"order": 11, "title": "Workflow banana", "type": "build_it", "content": "Workflow builder. Trigger — Form Submitted, Contact Created, Tag Added. Actions — Email, SMS, Tag, Pipeline Move. Test karna. Activate. History."},
                ],
                "quiz": {
                    "title": "Workflows Quiz",
                    "questions": [
                        {"q": "Workflow trigger matlab?", "options": ["Band karna", "Kaunsi event pe chale", "Delete karna", "Copy karna"], "answer": 1},
                        {"q": "Wait step kab?", "options": ["Permanently pause", "Kuch time baad next action", "Contact delete", "Email block"], "answer": 1},
                        {"q": "IF/ELSE kab?", "options": ["Sab same ho", "Different conditions pe different actions", "Koi action nahi", "Delete karna"], "answer": 1},
                        {"q": "Workflow test kaise?", "options": ["Direct live karo", "Test contact se trigger fire karo", "Delete karke banao", "Admin se poochho"], "answer": 1},
                        {"q": "'Add Tag' action?", "options": ["Contact delete", "Tag lagata hai", "Email bhejta hai", "Pipeline move"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Automation Workflow",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Complete automation workflow banao.",
                    "guidelines": [
                        "Automation > Workflows > New",
                        "Naam: 'New Lead Nurture'",
                        "Trigger: Form Submitted (week 4 wala)",
                        "Action 1: Tag — 'New Lead'",
                        "Action 2: Pipeline stage — 'New Lead'",
                        "Action 3: Wait 5 minutes",
                        "Action 4: Welcome Email bhejo",
                        "Action 5: Wait 1 day",
                        "Action 6: Follow-up SMS",
                        "Activate + test karo",
                        "Screenshots bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 120
                }
            },
            {
                "week": 6,
                "title": "AGENCY TASK — Complete Setup",
                "lessons": [
                    {"order": 12, "title": "Sub-Account kya hai?", "type": "watch_it", "content": "Har client ka alag sub-account. Banana. Access dena. Settings — business name, logo. Isolation — ek client doosra nahi dekh sakta."},
                    {"order": 13, "title": "Client Onboard karna", "type": "do_it", "content": "Client se info lena. Sub-account configure. Pipeline banana. Forms, calendar set. Workflow. Client walkthrough."},
                ],
                "quiz": {
                    "title": "Agency Quiz",
                    "questions": [
                        {"q": "Sub-account kiske liye?", "options": ["Agency ke liye", "Har client ke liye", "Employee ke liye", "Test ke liye"], "answer": 1},
                        {"q": "Client onboarding pehla step?", "options": ["Invoice bhejana", "Business info lena", "Sub-account delete", "Agency band"], "answer": 1},
                        {"q": "Ek client doosre ka data?", "options": ["Haan share hota", "Nahi, isolated hain", "Sirf admin dekhe", "Sirf billing share"], "answer": 1},
                        {"q": "Client ko access kaise?", "options": ["Email forward", "Sub-account mein user add", "Password share", "Screenshot"], "answer": 1},
                        {"q": "Agency vs sub-account?", "options": ["Koi farq nahi", "Agency master, sub-accounts clients", "Sub-account master", "Dono ek"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "FINAL AGENCY TASK",
                    "type": "build_it",
                    "day": "friday",
                    "description": "Complete GHL agency setup karo — real client jaisa.",
                    "guidelines": [
                        "Naya sub-account banao: 'Ahmed Real Estate' (fake client)",
                        "Business info — logo, address, phone, email",
                        "Pipeline: 'Property Leads' — New Inquiry > Site Visit > Proposal > Won > Lost",
                        "Form: 'Property Inquiry' — Name, Phone, Email, Budget, Property Type",
                        "Calendar: 'Site Visit' — Mon-Sat, 9am-5pm, 1 hour",
                        "Workflow: Form → Tag → Pipeline → SMS → Follow-up email",
                        "5 test contacts different stages mein",
                        "Form test — workflow chale",
                        "Screenshots + ek paragraph: 'Is setup se client ko kya faida?'"
                    ],
                    "submission_format": "screenshot_and_text",
                    "points": 200
                }
            }
        ]
    },

    "integration_expert": {
        "title": "Integration Expert — Zapier, Make, n8n",
        "track": "integration_expert",
        "level": 4,
        "duration_days": 45,
        "price_pkr": 8000,
        "weeks": [
            {
                "week": 1,
                "title": "Automation Concepts",
                "lessons": [
                    {"order": 1, "title": "Integration kya hoti hai?", "type": "watch_it", "content": "Two apps ko connect karna. Trigger-Action model. Webhook kya hota hai. REST API basics. JSON format samajhna."},
                    {"order": 2, "title": "Zapier Introduction", "type": "watch_it", "content": "Zapier — no-code automation. Zap kya hota hai. Trigger app + Action app. Free vs paid plan. 5000+ apps connected."},
                ],
                "quiz": {
                    "title": "Integration Basics Quiz",
                    "questions": [
                        {"q": "Webhook kya hota hai?", "options": ["Email address", "URL jo event pe data receive kare", "Password", "API key"], "answer": 1},
                        {"q": "JSON format kya hai?", "options": ["Image format", "Data exchange format", "Video format", "Audio format"], "answer": 1},
                        {"q": "Zapier mein Zap kya hai?", "options": ["Account", "Ek automation — trigger + action", "Payment", "Team member"], "answer": 1},
                        {"q": "Trigger app matlab?", "options": ["Jo action kare", "Jo event start kare automation ka", "Jo data store kare", "Jo email bheje"], "answer": 1},
                        {"q": "REST API kya karta hai?", "options": ["Website design", "Apps ke beech data exchange", "Email bhejta", "File store karta"], "answer": 1},
                    ]
                },
                "task": None
            },
            {
                "week": 2,
                "title": "Zapier with GHL",
                "lessons": [
                    {"order": 3, "title": "Zapier + GHL Connect", "type": "do_it", "content": "GHL Zapier integration. API key lena GHL se. Zapier mein GHL connect karna. Available triggers aur actions. Test karna."},
                    {"order": 4, "title": "Practical Zapier Workflows", "type": "build_it", "content": "GHL form → Google Sheet. New GHL contact → Slack notification. GHL deal won → Invoice generate. Multi-step zaps."},
                ],
                "quiz": {
                    "title": "Zapier + GHL Quiz",
                    "questions": [
                        {"q": "GHL API key kahan milta hai?", "options": ["Dashboard", "Settings > API Keys", "Contacts", "Workflows"], "answer": 1},
                        {"q": "Multi-step zap matlab?", "options": ["Ek trigger ek action", "Ek trigger multiple actions", "Multiple triggers", "Koi action nahi"], "answer": 1},
                        {"q": "Zapier free plan mein kitne zaps?", "options": ["100", "5", "Unlimited", "1000"], "answer": 1},
                        {"q": "GHL form data Zapier se Google Sheet mein kaise?", "options": ["Manual copy", "Zapier automation — GHL trigger > Google Sheet action", "Export/Import", "Email se"], "answer": 1},
                        {"q": "Zap test karna kyun zaroori?", "options": ["Zaroori nahi", "Confirm karna ke sahi kaam kare", "Delete ke liye", "Share ke liye"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Zapier + GHL Integration",
                    "type": "build_it",
                    "day": "wednesday",
                    "description": "GHL aur Google Sheets ko Zapier se connect karo.",
                    "guidelines": [
                        "Zapier.com pe account banao",
                        "GHL Settings se API key lo",
                        "Zapier mein GHL connect karo",
                        "Zap banao: GHL Form Submit → Google Sheet row add",
                        "Google Sheet mein columns: Name, Email, Phone, Date, Source",
                        "GHL form submit karo — Sheet mein row aaye",
                        "Screenshots share karo"
                    ],
                    "submission_format": "screenshot",
                    "points": 100
                }
            },
            {
                "week": 3,
                "title": "Make.com (Integromat)",
                "lessons": [
                    {"order": 5, "title": "Make.com kya hai?", "type": "watch_it", "content": "Make.com — visual automation builder. Zapier se zyada powerful. Scenario kya hota hai. Modules aur connections. Free plan — 1000 operations/month."},
                    {"order": 6, "title": "Make.com Scenarios", "type": "build_it", "content": "Scenario banana. Modules drag and drop. Filters add karna. Iterator aur Aggregator. Error handling. Scheduling."},
                ],
                "quiz": {
                    "title": "Make.com Quiz",
                    "questions": [
                        {"q": "Make.com free plan operations?", "options": ["100/month", "500/month", "1000/month", "Unlimited"], "answer": 2},
                        {"q": "Make.com Zapier se better kyun?", "options": ["Sasta hai", "Zyada powerful, visual builder, complex flows", "Sirf simple", "Sirf email"], "answer": 1},
                        {"q": "Scenario mein Filter kya karta hai?", "options": ["Data delete", "Sirf specific data age bhejta", "Data save", "Data format"], "answer": 1},
                        {"q": "Iterator kya karta hai?", "options": ["Ek item process", "Array ke har item ko alag process", "Data merge", "Data sort"], "answer": 1},
                        {"q": "Error handling kyun zaroori?", "options": ["Zaroori nahi", "Agar koi step fail ho toh automation handle kare", "Delete ke liye", "Speed ke liye"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Make.com Scenario",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Make.com mein GHL integration scenario banao.",
                    "guidelines": [
                        "Make.com pe account banao",
                        "GHL module connect karo",
                        "Scenario: New GHL Contact → Filter (city = Lahore) → Gmail notification",
                        "Test karo — Lahore ka contact add karo GHL mein",
                        "Gmail notification aaye",
                        "Scenario screenshot + execution log screenshot bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 100
                }
            },
            {
                "week": 4,
                "title": "n8n — Open Source Automation",
                "lessons": [
                    {"order": 7, "title": "n8n kya hai?", "type": "watch_it", "content": "n8n — open source automation. Self-hosted ya cloud. Zapier/Make se farq — free unlimited. Node-based workflow. 400+ integrations."},
                    {"order": 8, "title": "n8n Workflow banana", "type": "build_it", "content": "n8n cloud trial. Workflow canvas. Nodes add karna. Credentials set karna. Webhook node. HTTP Request node. JSON manipulate karna."},
                ],
                "quiz": {
                    "title": "n8n Quiz",
                    "questions": [
                        {"q": "n8n Zapier se farq?", "options": ["Same hi hai", "Open source, self-host kar sakte, unlimited free", "Sirf paid", "Kam integrations"], "answer": 1},
                        {"q": "n8n mein Webhook node kaam?", "options": ["Email bhejta hai", "External apps se data receive karta hai", "Database se connect", "File upload"], "answer": 1},
                        {"q": "HTTP Request node kab use?", "options": ["Sirf email ke liye", "Kisi bhi API se connect karne ke liye", "Sirf GHL ke liye", "Sirf Google ke liye"], "answer": 1},
                        {"q": "Self-hosted matlab?", "options": ["n8n company pe", "Apne server pe install karna", "Cloud pe only", "Mobile pe"], "answer": 1},
                        {"q": "n8n credentials kya hain?", "options": ["Username password for n8n", "API keys aur tokens for connected apps", "Payment info", "Domain info"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "n8n + GHL Webhook",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "n8n se GHL webhook set karo.",
                    "guidelines": [
                        "n8n.io cloud trial start karo",
                        "Naya workflow banao",
                        "Webhook node add karo — URL copy karo",
                        "GHL mein workflow banao — trigger: contact created",
                        "Action: HTTP Request — n8n webhook URL pe data bhejo",
                        "n8n mein Set node add karo — data format karo",
                        "Google Sheets node — row add karo",
                        "End-to-end test karo",
                        "n8n execution screenshot bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 120
                }
            },
            {
                "week": 5,
                "title": "Advanced Integration Patterns",
                "lessons": [
                    {"order": 9, "title": "GHL API Direct Use", "type": "type_it", "content": "GHL REST API documentation. API key authentication. GET, POST, PUT requests. Contacts API. Opportunities API. Postman se test karna."},
                    {"order": 10, "title": "AI + GHL Integration", "type": "build_it", "content": "ChatGPT API GHL ke saath. AI-generated responses automation mein. OpenAI API key. Prompt engineering for GHL. AI qualification bot."},
                ],
                "quiz": {
                    "title": "Advanced Integration Quiz",
                    "questions": [
                        {"q": "API authentication ke liye?", "options": ["Username/password", "API key ya Bearer token", "Email only", "Phone number"], "answer": 1},
                        {"q": "GET request kya karta hai?", "options": ["Data create karta hai", "Data fetch/read karta hai", "Data delete karta hai", "Data update karta hai"], "answer": 1},
                        {"q": "POST request kya karta hai?", "options": ["Data read", "Naya data create karta hai", "Data delete", "Data list"], "answer": 1},
                        {"q": "Postman kya hai?", "options": ["Email client", "API testing tool", "Code editor", "Database tool"], "answer": 1},
                        {"q": "AI qualification bot GHL mein kya karta hai?", "options": ["Humans replace karta hai", "Leads automatically qualify karta hai", "Billing handle karta hai", "Reports banata hai"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "AI + GHL Bot",
                    "type": "build_it",
                    "day": "friday",
                    "description": "GHL mein AI-powered lead qualification bot banao.",
                    "guidelines": [
                        "OpenAI API key lo (ya free alternative)",
                        "GHL workflow banao: Form Submit trigger",
                        "Make.com/n8n se ChatGPT API call karo",
                        "Prompt: 'Lead ka naam {name}, budget {budget}, zaroorat {need}. Qualify karo aur next step suggest karo.'",
                        "AI response GHL contact notes mein save karo",
                        "Tag add karo based on AI response — 'Qualified' ya 'Needs Follow-up'",
                        "Test karo + screenshots bhejo"
                    ],
                    "submission_format": "screenshot",
                    "points": 150
                }
            },
            {
                "week": 6,
                "title": "FINAL — Complete Integration Project",
                "lessons": [
                    {"order": 11, "title": "Integration Project Plan", "type": "teach_it", "content": "Real client ke liye complete automation. Requirements gather karna. Tools select karna. Build karna. Test karna. Document karna. Client ko hand over karna."},
                ],
                "quiz": {
                    "title": "Integration Expert Final Quiz",
                    "questions": [
                        {"q": "Client ke liye automation build karne ka pehla step?", "options": ["Code likhna", "Requirements gather karna", "Invoice bhejana", "Tools buy karna"], "answer": 1},
                        {"q": "Zapier vs Make vs n8n — choose kaise karein?", "options": ["Sab ek jaisi hain", "Complexity, budget aur scale ke hisaab se", "Sirf Zapier use karo", "Sirf n8n use karo"], "answer": 1},
                        {"q": "Automation documentation kyun?", "options": ["Zaroori nahi", "Future maintenance aur client handover ke liye", "Billing ke liye", "Marketing ke liye"], "answer": 1},
                        {"q": "Integration fail hone pe?", "options": ["Ignore karo", "Error logs check karo, debug karo, notify client", "Client ko blame karo", "Tool change karo"], "answer": 1},
                        {"q": "Best practice for API keys?", "options": ["Share karo freely", "Secret rakho, .env mein store karo", "Code mein hardcode karo", "Email mein bhejo"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "FINAL — Complete Automation System",
                    "type": "build_it",
                    "day": "friday",
                    "description": "Ek real-world complete automation system banao.",
                    "guidelines": [
                        "Fake client: 'Sara Beauty Salon'",
                        "GHL sub-account setup — salon ka",
                        "Booking form + calendar",
                        "Zapier/Make: New booking → WhatsApp reminder (1 day pehle)",
                        "n8n: Appointment complete → Review request SMS",
                        "Make.com: Monthly bookings → Google Sheet report",
                        "AI: Post-service feedback form → AI sentiment analysis → Tag karo",
                        "Pura system document karo — ek Google Doc mein",
                        "Video walkthrough bhejo (Loom ya screen record)"
                    ],
                    "submission_format": "video_and_document",
                    "points": 250
                }
            }
        ]
    },

    "client_hunting": {
        "title": "Client Hunting & Portfolio",
        "track": "client_hunting",
        "level": 5,
        "duration_days": 45,
        "price_pkr": 12000,
        "weeks": [
            {
                "week": 1,
                "title": "Portfolio Banana",
                "lessons": [
                    {"order": 1, "title": "Portfolio kya hota hai?", "type": "watch_it", "content": "Portfolio — apna kaam dikhana. GHL portfolio kaise dikhayein. Case study format. Before/After. Client results. Screenshots aur videos."},
                    {"order": 2, "title": "Portfolio Website", "type": "build_it", "content": "Portfolio site banana — WordPress ya Carrd.co. Services page. Case studies. Contact form. Testimonials. Professional look."},
                ],
                "quiz": {
                    "title": "Portfolio Quiz",
                    "questions": [
                        {"q": "Portfolio mein sabse important kya?", "options": ["Apni photo", "Real client results aur work samples", "Certificates only", "Pricing only"], "answer": 1},
                        {"q": "Case study format mein kya hona chahiye?", "options": ["Sirf client naam", "Problem + Solution + Results", "Sirf screenshots", "Sirf testimonial"], "answer": 1},
                        {"q": "Portfolio site ke liye best free tool?", "options": ["Instagram", "Carrd.co ya WordPress", "WhatsApp", "Email"], "answer": 1},
                        {"q": "Testimonial kya hota hai?", "options": ["Apni review", "Client ki positive feedback", "Certification", "Award"], "answer": 1},
                        {"q": "Portfolio update kab karein?", "options": ["Sirf ek baar", "Har naye kaam ke baad", "Saal mein ek baar", "Kabhi nahi"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Portfolio Setup",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Apna GHL portfolio website banao.",
                    "guidelines": [
                        "Carrd.co ya WordPress pe portfolio site banao",
                        "Pages: Home, Services, Portfolio/Work, Contact",
                        "Services list karo: GHL Setup, Automation, Training",
                        "Ek case study likho (course ka final project use karo)",
                        "Contact form lagao",
                        "Professional logo ya naam header mein",
                        "Site URL share karo + screenshots"
                    ],
                    "submission_format": "url_and_screenshot",
                    "points": 100
                }
            },
            {
                "week": 2,
                "title": "LinkedIn Strategy",
                "lessons": [
                    {"order": 3, "title": "LinkedIn Profile Optimize", "type": "do_it", "content": "Professional headline — 'GoHighLevel Expert | CRM & Automation Specialist'. About section — 3 paragraphs. Experience section. Skills — GHL, CRM, Zapier, Make.com. Recommendations."},
                    {"order": 4, "title": "LinkedIn Content Strategy", "type": "teach_it", "content": "Posting consistency — 3x per week. Content types — tips, case studies, behind-the-scenes. Hashtags — #GoHighLevel #CRM #Automation. Engagement — comments, DMs. LinkedIn SSI score."},
                ],
                "quiz": {
                    "title": "LinkedIn Quiz",
                    "questions": [
                        {"q": "LinkedIn headline mein kya likho?", "options": ["Sirf naam", "Job title + key skills + value", "Sirf company naam", "Contact number"], "answer": 1},
                        {"q": "LinkedIn pe posting frequency?", "options": ["Mahine mein ek baar", "Roz 10 posts", "3-5 times per week", "Sirf jab client mile"], "answer": 2},
                        {"q": "LinkedIn DM mein pehla message?", "options": ["Seedha service offer", "Introduce karo + value dena + soft ask", "Price list bhejo", "Portfolio link only"], "answer": 1},
                        {"q": "LinkedIn SSI score kya measure karta hai?", "options": ["Connections count", "Social Selling effectiveness", "Post likes", "Profile views"], "answer": 1},
                        {"q": "LinkedIn pe best content type GHL ke liye?", "options": ["Memes only", "Before/after client results + tips", "Personal photos", "Job posts"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "LinkedIn Profile Optimize",
                    "type": "do_it",
                    "day": "wednesday",
                    "description": "LinkedIn profile complete optimize karo.",
                    "guidelines": [
                        "Professional headshot lagao",
                        "Headline: 'GoHighLevel Expert | CRM & Marketing Automation | Helping Businesses Scale'",
                        "About section likho — 3 paragraphs: who you are, what you do, call to action",
                        "Skills add karo: GoHighLevel, CRM, Zapier, Make.com, Marketing Automation, Lead Generation",
                        "Featured section mein portfolio link add karo",
                        "Ek LinkedIn post karo — GHL tip",
                        "Profile URL share karo"
                    ],
                    "submission_format": "url_and_screenshot",
                    "points": 80
                }
            },
            {
                "week": 3,
                "title": "Facebook Client Hunting",
                "lessons": [
                    {"order": 5, "title": "Facebook Groups Strategy", "type": "watch_it", "content": "Right groups join karna — GHL users, small business owners, marketing agencies. Value-first approach — help karo pehle. Soft selling. DM strategy. Facebook business page."},
                    {"order": 6, "title": "Facebook Outreach", "type": "do_it", "content": "Ideal client identify karna. DM template — personalized, value-based. Follow up sequence. Facebook Ads basics for lead gen. Retargeting concept."},
                ],
                "quiz": {
                    "title": "Facebook Strategy Quiz",
                    "questions": [
                        {"q": "Facebook group mein pehle kya karein?", "options": ["Seedha service advertise", "Value provide karo, help karo, phir offer", "Price list post karo", "Portfolio link share"], "answer": 1},
                        {"q": "Ideal client FB pe kaise dhundein?", "options": ["Random DM karo", "Business owners groups, GHL users groups", "Friends ko DM karo", "Ads chalao sirf"], "answer": 1},
                        {"q": "DM mein opening line?", "options": ["'Kya aapko GHL chahiye?'", "Personalized comment on their post + value", "'Meri services lo'", "Price bhejo"], "answer": 1},
                        {"q": "Follow up kab karein?", "options": ["Kabhi nahi", "3-5 din baad ek baar", "Roz message karo", "Ek ghante mein"], "answer": 1},
                        {"q": "Facebook Business Page kyun zaroori?", "options": ["Zaroori nahi", "Professional presence + reviews + ads run karna", "Sirf fun ke liye", "Sirf family ke liye"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Facebook Outreach",
                    "type": "do_it",
                    "day": "wednesday",
                    "description": "Facebook pe 5 potential clients identify karo aur outreach karo.",
                    "guidelines": [
                        "3 relevant Facebook groups join karo (GHL users, small business, marketing)",
                        "Facebook Business Page banao",
                        "Ek helpful post karo group mein — GHL tip ya tutorial",
                        "5 potential clients identify karo (business owners)",
                        "Personalized DM bhejo — value-based, not salesy",
                        "DM template: 'Hi [Name], aapki [specific thing] dekhi. Mujhe laga [specific tip] help kar sakti. Main GHL expert hun — [one liner value].'",
                        "Screenshots share karo — groups, page, DMs"
                    ],
                    "submission_format": "screenshot",
                    "points": 100
                }
            },
            {
                "week": 4,
                "title": "Upwork & Fiverr",
                "lessons": [
                    {"order": 7, "title": "Upwork Profile Setup", "type": "do_it", "content": "Upwork profile optimize karna. Title — 'GoHighLevel Expert & CRM Automation Specialist'. Overview — results-focused. Portfolio upload. Skills. Hourly rate — $15-35 starting. Availability."},
                    {"order": 8, "title": "Winning Proposals", "type": "type_it", "content": "Proposal structure — hook, understanding, solution, proof, CTA. Personalization. Cover letter length. Bid strategically. Fixed price vs hourly. Follow up on proposals."},
                ],
                "quiz": {
                    "title": "Upwork/Fiverr Quiz",
                    "questions": [
                        {"q": "Upwork profile mein sabse important?", "options": ["Photo only", "Complete profile + portfolio + reviews", "Hourly rate sirf", "Location only"], "answer": 1},
                        {"q": "Proposal ka pehla line kya ho?", "options": ["'Dear Client'", "Client ki specific problem ko address karo", "'I am expert'", "Price mention karo"], "answer": 1},
                        {"q": "GHL ke liye starting hourly rate?", "options": ["$5", "$15-35", "$100+", "$200+"], "answer": 1},
                        {"q": "JSS (Job Success Score) kya hai Upwork pe?", "options": ["Profile views", "Client satisfaction percentage", "Earnings total", "Proposals sent"], "answer": 1},
                        {"q": "Fiverr gig title mein kya?", "options": ["Sirf naam", "Specific service + keyword + benefit", "Sirf price", "Sirf skills"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Upwork + Fiverr Profile",
                    "type": "build_it",
                    "day": "thursday",
                    "description": "Upwork aur Fiverr pe professional profiles set karo.",
                    "guidelines": [
                        "Upwork account banao — complete profile",
                        "Title: 'GoHighLevel Expert | CRM Setup & Marketing Automation'",
                        "Overview likhno — 300 words, results-focused",
                        "Portfolio mein course project add karo",
                        "Fiverr pe 2 gigs banao: 1) GHL Sub-Account Setup, 2) GHL Workflow Automation",
                        "Gig images professionally design karo (Canva)",
                        "Packages: Basic/Standard/Premium with clear deliverables",
                        "Both profiles ka link share karo"
                    ],
                    "submission_format": "url_and_screenshot",
                    "points": 120
                }
            },
            {
                "week": 5,
                "title": "Proposals & Pricing",
                "lessons": [
                    {"order": 9, "title": "Proposal Writing Mastery", "type": "type_it", "content": "Winning proposal formula. Research client before writing. Address pain points. Show specific solution. Social proof. Clear next steps. Follow-up email sequence."},
                    {"order": 10, "title": "Pricing Your Services", "type": "teach_it", "content": "Hourly vs project-based vs retainer. GHL services pricing: Setup $200-500, Monthly management $300-800, Custom automation $500-2000. Value-based pricing. Proposal stages."},
                ],
                "quiz": {
                    "title": "Proposals & Pricing Quiz",
                    "questions": [
                        {"q": "Value-based pricing matlab?", "options": ["Time ke hisaab se charge", "Client ko jo value milti hai us pe base price", "Market rate se copy", "Sab clients same price"], "answer": 1},
                        {"q": "Retainer model kya hai?", "options": ["Ek baar payment", "Monthly fixed fee for ongoing work", "Per hour charge", "Free work"], "answer": 1},
                        {"q": "GHL setup ka starting price?", "options": ["$50", "$200-500", "$5000+", "Free"], "answer": 1},
                        {"q": "Proposal mein social proof kya hai?", "options": ["Apni photo", "Past client results aur testimonials", "Price list", "Terms and conditions"], "answer": 1},
                        {"q": "Follow-up email kab bhejein?", "options": ["Kabhi nahi", "Proposal ke 3-5 din baad agar reply nahi", "Roz ek email", "Proposal ke saath hi"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "Proposal Writing",
                    "type": "type_it",
                    "day": "thursday",
                    "description": "3 different client ke liye proposals likho.",
                    "guidelines": [
                        "Scenario 1: Real estate agency — GHL CRM setup chahiye",
                        "Scenario 2: E-commerce brand — automation aur follow-up sequences",
                        "Scenario 3: Coaching business — funnel + calendar + payment",
                        "Har proposal mein: Hook, Understanding problem, Your solution, Proof, Timeline, Price, CTA",
                        "Prices realistic rakho",
                        "Proposals Google Docs mein likho aur share karo"
                    ],
                    "submission_format": "document",
                    "points": 120
                }
            },
            {
                "week": 6,
                "title": "FINAL — First Client Project",
                "lessons": [
                    {"order": 11, "title": "Client Communication", "type": "teach_it", "content": "Professional communication. Scope of work document. Project timeline. Status updates. Revision policy. Invoice banana. Client feedback handle karna. Long-term relationship."},
                ],
                "quiz": {
                    "title": "Client Hunting Final Quiz",
                    "questions": [
                        {"q": "Scope of work document kyun?", "options": ["Zaroori nahi", "Clear expectations set karna — kya karein ge, kya nahi", "Billing ke liye", "Contract copy"], "answer": 1},
                        {"q": "Client revision request aaye toh?", "options": ["Seedha refuse karo", "Scope check karo — andar hai toh karo, bahar hai toh extra charge", "Free karo sab", "Project band karo"], "answer": 1},
                        {"q": "Invoice mein kya hona chahiye?", "options": ["Sirf amount", "Services list, amount, payment terms, due date, payment method", "Sirf date", "Sirf naam"], "answer": 1},
                        {"q": "Client ko status update kab?", "options": ["Kabhi nahi", "Weekly ya milestone pe proactively", "Sirf jab client pooche", "Project end mein"], "answer": 1},
                        {"q": "Long-term client relationship ke liye?", "options": ["Sirf kaam karo", "Results deliver karo + communicate karo + value add karte raho", "Price kam karo", "Gifts bhejo"], "answer": 1},
                    ]
                },
                "task": {
                    "title": "FINAL — Complete Client Project Simulation",
                    "type": "build_it",
                    "day": "friday",
                    "description": "Ek complete client project simulate karo — discovery se delivery tak.",
                    "guidelines": [
                        "Fake client: 'Dr. Bilal — Dental Clinic'",
                        "Discovery call notes likho — 5 pain points identify karo",
                        "Proposal bhejo — pricing, timeline, deliverables",
                        "Scope of work document banao",
                        "GHL sub-account setup karo — dental clinic ke liye",
                        "Appointment system, patient follow-up workflow, review request automation",
                        "Client report banao — kya kiya, results, screenshots",
                        "Invoice generate karo",
                        "Puri folder share karo — Discovery notes, Proposal, SOW, Report, Invoice"
                    ],
                    "submission_format": "document_and_screenshot",
                    "points": 300
                }
            }
        ]
    }
}


def get_curriculum(track: str) -> dict:
    return CURRICULUM.get(track, {})


def assess_student_level(form_data: dict) -> dict:
    """
    Hardcoded assessment — NO Claude API.
    Returns recommended phase.
    """
    has_computer = form_data.get("has_computer_skills", False)
    has_laptop = form_data.get("has_laptop", False)
    computer_skills = form_data.get("computer_skills", [])
    english = form_data.get("english_level", "none")

    score = 0

    if has_computer:
        score += 1
    if has_laptop:
        score += 1
    if "MS Word / Excel" in computer_skills:
        score += 1
    if "WordPress" in computer_skills:
        score += 2
    if "Coding / Programming" in computer_skills:
        score += 2
    if len(computer_skills) >= 3:
        score += 1
    if english == "fluent":
        score += 2
    elif english == "medium":
        score += 1

    if not has_laptop:
        return {
            "recommended_track": "computer_basics",
            "recommended_level": 1,
            "reason": "Laptop hona zaroori hai GHL seekhne ke liye. Pehle computer basics cover karein.",
            "score": score
        }
    elif score <= 2:
        return {
            "recommended_track": "computer_basics",
            "recommended_level": 1,
            "reason": "Pehle computer aur internet ki basics cover karein — yeh GHL ki foundation hai.",
            "score": score
        }
    elif score <= 5:
        return {
            "recommended_track": "web_fundamentals",
            "recommended_level": 2,
            "reason": "Computer basics theek hain. Ab domain, hosting, WordPress — jo GHL ke liye zaroori hain.",
            "score": score
        }
    else:
        return {
            "recommended_track": "ghl_developer",
            "recommended_level": 3,
            "reason": "Aapki foundation strong hai. Seedha GHL Level 1 se shuru kar sakte hain.",
            "score": score
        }
