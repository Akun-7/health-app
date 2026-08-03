@AGENTS.md

# HealthTrack (health-app) — долбоордун контексти

Бул файл ар бир сессияда автоматтык окулат. Максаты — Claude'го долбоордун учурдагы абалын, тандалган стекти жана эрежелерди кайра түшүндүрбөй эле берүү.

## Долбоор жөнүндө

Аты: HealthTrack (папка аты: `health-app`)
Түрү: Ден-соолук көрсөткүчтөрүн (кан басым, пульс, SpO2) кол менен киргизип, тарыхын көзөмөлдөгөн жана дары/эскертме коюлган мобилдик тиркеме.
Тил: UI кыргызча/орусча/англисче — `src/i18n/` жана `LocaleContext` аркылуу (тандалган тил `health-app/locale` ачкычы менен `AsyncStorage`до сакталат, демейки — `ky`).
Максаттуу колдонуучу: Кыргызстан/Орусиядагы орто жаштагы жана улгайган колдонуучулар.

**Учурдагы фаза: MVP + cloud'го деплойлонгон auth сервер.** Чыныгы email/сырсөз аутентификациясы бар (`server/`), 2026-07-26дан баштап Render.com'дун акысыз tier'ине деплой болгон (`https://healthtrack-api-shw7.onrender.com`, толук деталь — "Cloud'го деплой кылуу" бөлүмүн кара). **Бирок бул толук production-ready дегенди билдирбейт** — Render'дин акысыз tier'инде persistent disk жок, JSON-файл сактоо ephemeral (redeploy/restart сайын тазаланат). Профиль/өлчөө/эскертме дайындары дагы деле `AsyncStorage` аркылуу түзмөктө сакталат (сервер аккаунт менен email/sырсөз hash'ин гана сактайт, башка эч нерсени эмес).

## Тех стек (иш жүзүндө колдонулуп жаткан)

- **Mobile:** Expo SDK ~54 (2026-07-25'тен баштап; мурун 57 эле, физикалык түзмөктөгү Expo Go'нун SDK 54'кө чейин гана колдогонуна байланыштуу түшүрүлдү), React Native 0.81, React 19.1, TypeScript
- **Навигация:** `@react-navigation/native` + `native-stack` (v7) — бир гана `RootNavigator` (`src/navigation/RootNavigator.tsx`), stack ичинде экрандар: Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings, SOS, EmergencyContacts, AddEmergencyContact, Chat, DoctorInbox, Bluetooth, Sleep. Баштапкы route `AuthContext`/`ProfileContext`нин `loading` бүткөндөн кийин эсептелет: `!user` → Login, `user.role === 'doctor'` → DoctorInbox (ProfileSetup/Dashboard такыр четтелет), `!profile` → ProfileSetup, экинчиси → Dashboard.
- **State/сактоо:** React Context (`createContext`/`useContext`) ар бир домен үчүн өзүнчө provider, дайыма `@react-native-async-storage/async-storage` менен персистенттелет. `App.tsx` алардын баарын `ComposeProviders` (`src/context/ComposeProviders.tsx`) аркылуу бириктирет — провайдер саны көбөйүп, кол менен вложить кылуу окулбай калгандан кийин кошулган; жаны context кошсоңуз ошол массивге кош, кол менен JSX-вложить кылба:
  - `MeasurementsContext` → `health-app/measurements` (2026-07-26дан баштап cloud'го дагы синхрондошот жана `secureStorage` менен шифрленет — тиешелүү бөлүмдөрдү кара)
  - `ProfileContext` → `health-app/profile` (cloud sync + шифрлөө бар, жогорудагыдай эле)
  - `RemindersContext` → `health-app/reminders` (cloud sync + шифрлөө бар, notification'дор дагы эле локалдуу)
  - `ReminderLogContext` → `health-app/reminderLog` (дары/эскертме аткарылуу тарыхы: `taken`/`skipped` + убакыт; шифрленет, cloud sync жок)
  - `SettingsContext` → `health-app/settings`
  - `LocaleContext` → `health-app/locale`
  - `AuthContext` → `health-app/authToken` (JWT гана сакталат; `user` объектиси серверден `/api/auth/me` менен алынат)
  - `EmergencyContactsContext` → `health-app/emergencyContacts`
  - `StepsContext` → `health-app/steps` (учурдагы күндүн кадам саны)
  - `SleepContext` → (өзү сактабайт, `src/sleep/sleepSampling.ts`деги `health-app/sleepSamples`ди окуйт)
  - **Zustand, Redux, Prisma, PostgreSQL — колдонулбайт.** (Мурунку талкууда сунушталган, бирок иш жүзүндө башка жол тандалган.)
- **Backend/auth:** `server/` — Express + TypeScript, `tsx` менен иштейт (`npm run dev` — `server/`дин ичинде). Колдонуучулар `server/data/users.json` файлында сакталат (JSON, native DB эмес — `better-sqlite3` бул машинада Visual Studio Build Tools жоктугунан compile болбойт, ошондуктан колдонулбайт). JSON-файлдын жайгашкан жери `server/src/dataDir.ts`теги `dataFilePath()` аркылуу аныкталат — дефолт `server/data/`, бирок `DATA_DIR` env коюлса ошол жерге жазат (cloud'до persistent volume'го көрсөтүү үчүн). Пароль `bcryptjs` менен hash'делет, сессия `jsonwebtoken` (`JWT_SECRET` env; локалдуу dev'де дефолт туруктуу сыр сөз колдонулат, бирок `NODE_ENV=production`де `JWT_SECRET` жок болсо сервер асти иштебей, дароо катачылык менен токтойт — `server/src/auth.ts`). Ар бир колдонуучунун `role: 'patient' | 'doctor'` талаасы бар (signup'та тандалат, эч кандай текшерүү жок). Эндпоинттер: `POST /api/auth/signup` (`{email,password,role?}`), `POST /api/auth/login`, `GET /api/auth/me` (`Authorization: Bearer <token>`); чат — `GET/POST /api/chat/messages` (пациенттин өз thread'и), `GET /api/chat/threads` (дарыгер-гана, бардык пациенттердин тизмеси), `GET/POST /api/chat/messages/:patientId` (дарыгер-гана, белгилүү пациенттин thread'и). `requireAuth`/`AuthedRequest` `server/src/authMiddleware.ts`де — `app.ts` менен `chatRoutes.ts`нин ортосундагы circular import'ту болтурбоо үчүн өзүнчө файлга бөлүнгөн. `src/api/client.ts` серверди `expo-constants`теги `hostUri`ден LAN IP'ди алып табат (телефон/веб экөө тең иштеши үчүн), порт 4000ге катуу коюлган; эгер `EXPO_PUBLIC_API_URL` build-time env коюлса, ал LAN-IP логикадан мурда артыкчылык алат (production build'дер cloud серверге ушул аркылуу көрсөтөт). Сырсөз калыбына келтирүү: `POST /api/auth/forgot-password` (`{email}`, аккаунт бар/жогун ачыкка чыгарбоо үчүн дайыма `{ok:true}` кайтарат), `POST /api/auth/reset-password` (`{email,code,newPassword}`) — толук деталь төмөндөгү "Шифрлөө жана сырсөз калыбына келтирүү" бөлүмүндө.
- **Коопсуздук (шифрлөө):** `src/storage/secureStorage.ts` — `AsyncStorage`ге жазаардын ордуна колдонулуучу drop-in wrapper, Measurements/Profile/Reminders/ReminderLog контексттери мунун баары колдонот. Ачкыч `expo-secure-store` (OS keychain/keystore) аркылуу сакталат, дайын өзү `crypto-js`теги AES-CBC менен шифрленет (IV ар бир жазуу үчүн `expo-crypto`деги `getRandomBytesAsync` менен жаны түзүлөт). Веб платформада (`Platform.OS === 'web'`) `expo-secure-store` иштебегендиктен, шифрлөө өчүрүлүп, жөнөкөй `AsyncStorage` колдонулат.
- **i18n:** `src/i18n/{ky,ru,en}.ts` — тегиз (dot-namespaced) ачкычтуу сөздүктөр, `ky.ts` канондук (`TranslationKey` ушундан чыгарылат, `ru`/`en` `Record<TranslationKey, string>` менен толуктугу текшерилет). `LocaleContext`деги `t(key, params?)` `{param}` интерполяциясын колдойт. Тил тандагычта ар бир тил өз энчилүү атында көрсөтүлөт (`localeNativeName`), учурдагы тилге которулбайт.
- **Иконкалар:** `@tabler/icons-react-native`
- **Билдирмелер (reminders):** `expo-notifications`, логика `src/notifications/reminderNotifications.ts` ичинде
- **Дизайн токендер:** `src/theme/` — `colors.ts` (light/dark), `typography.ts`, `spacing.ts`, `radii.ts`, баары `ThemeProvider.tsx` аркылуу `useTheme()` менен колдонулат
- **SOS:** `expo-sms` (native SMS composer) + `Linking`деги `tel:` fallback. Cloud/backend аркылуу эмес — толугу менен түзмөктүн өзүндө иштейт.
- **Bluetooth (BLE):** `react-native-ble-plx` — native модуль, **Expo Go'до иштебейт**, custom dev client build талап кылат (`eas build --profile development`). `src/ble/gatt.ts` — Bluetooth SIG стандарттуу Blood Pressure Service (0x1810) жана Pulse Oximeter Service (0x1822) UUID'лары + IEEE-11073 SFLOAT парсинг. `BleContext` сканерлөө/туташуу абалын башкарат, `web` платформасында `supported=false` менен graceful түрдө өчүрүлөт.
- **Проактивдүү эскертүү:** `MeasurementsContext.addMeasurement` ар бир жаны жазуудан кийин `src/data/insights.ts`теги `classify()` менен статусту текшерет; `concern` болсо, `src/notifications/thresholdAlerts.ts` дароо (`trigger: null`) локалдуу push-notification жиберет. Уруксат сурабайт — эгер `expo-notifications` уруксаты жок болсо, унчукпай эч нерсе кылбайт.
- **Дары/эскертме аткарылуу тарыхы:** `ReminderLogContext` (`health-app/reminderLog`). Эки жол менен катталат: (1) `ReminderListItem`деги "Аткардым"/"Өткөрүп жиберди" баскычтары, (2) notification'дун өзүндөгү action баскычтары (`src/notifications/reminderNotifications.ts`теги `configureAdherenceCategory` + `ReminderLogContext`теги `Notifications.addNotificationResponseReceivedListener`) — колдонуучу тиркемени ачпастан эле билдирүүдөн жооп бере алат. `src/data/reminderLog.ts`теги `weeklyStats()` акыркы 7 күндүн статистикасын эсептейт.
- **Кадам эсептегич:** `expo-sensors`теги `Pedometer`, `StepsContext`. **iOS** `getStepCountAsync(startOfToday, now)` менен так "бүгүнкү" санды сурайт. **Android**да мындай тарыхый API жок — `watchStepCount()`тун delta'ларын `health-app/steps`ке топтоп сактайт (күн сайын `todayKey()` менен reset), демек **колдонмо ачык турганда гана эсептелет** (так эмес, тиркеме жабык кезде өткөн кадамдар эсепке кирбейт).
- **Уйку эсептегич (эксперименталдык):** `expo-task-manager` + `expo-background-task` (`src/sleep/sleepSampling.ts`) 15 мүнөттүк минималдуу интервал менен (OS иш жүзүндө муну алда канча узартып коюшу мүмкүн — гарантия жок) акселерометрдин магнитудасынын дисперсиясын өлчөп, `still`/эмес деп сактайт (`health-app/sleepSamples`). `src/data/sleep.ts`теги `inferSessions()` 3 сааттан ашкан удаама-удаа "still" интервалдарды уйку катары чечмелейт. `SleepScreen`де "Азыр текшерүү" баскычы бар — фондук scheduler'ди тике текшерүүнүн эч кандай жолу жок болгондуктан, ошол баскыч сессия ичинде текшере турган жалгыз ыкма.

⚠️ **Маанилуу:** `AGENTS.md`де айтылгандай, долбоор SDK 54'кө түшүрүлгөн (Expo Go'нун телефондогу колдоо чегине жараша). Код жазаардын алдында так версияланган документти текшер: https://docs.expo.dev/versions/v54.0.0/

## Иштетүү (локалдуу дев)

Эки процесс өзүнчө иштетилиши керек:
1. **Auth сервер:** `server/` папкасынын ичинде `npm install` (биринчи жолу), андан кийин `npm run dev` — `http://0.0.0.0:4000`де угат.
2. **Mobile app:** `health-app/` тамырында `npx expo start` (же `--web`) — Metro'нун LAN IP'син `src/api/client.ts` автоматтык алат (`expo-constants`теги `hostUri` аркылуу), сервердин портун (4000) гана өзгөрүшсүз колдонот. Телефон/эмулятор компьютер менен бир Wi-Fi'де болушу керек, антпесе `auth.networkError` көрүнөт.

⚠️ **2026-07-26дан баштап тамырда `.env` файлы бар** (`EXPO_PUBLIC_API_URL=https://healthtrack-api-shw7.onrender.com`) — бул LAN-IP логикадан **мурда** артыкчылык алат, демек `.env` бар кезде жогорудагы 2-кадам локалдуу серверди эмес, production Render серверин колдонот. Локалдуу серверди сынагыңыз келсе, `.env`ди убактылуу өчүрүү/өчүрүп коюу (мис. `.env.local`га которуу же сапты comment кылуу) керек.

⚠️ **Bluetooth'ту текшерүү үчүн Expo Go жетишсиз** — `react-native-ble-plx` native код талап кылат. Керек болот: `eas login` (колдонуучунун өз Expo аккаунту менен), `eas build:configure`, `eas build --platform android --profile development` (профиль `eas.json`де даяр). Курулган APK'ды телефонго орнотуп, андан кийин `npx expo start --dev-client` менен туташуу. Бул компьютерде Android SDK/gradle/Java жок (текшерилди, 2026-07-26) — локалдуу build мүмкүн эмес, EAS Build (cloud) гана жол. Expo access token'дерди Claude'го эч качан түз бербеңиз (чат билдирүүсү катары да, `!` командасынын ичинде да) — эки жолу ушундай окуя болгон, экөө тең revoke кылынышы керек болчу.

## Cloud'го деплой кылуу (Render.com, "Production readiness" #1)

Баштапкы план Fly.io болчу, бирок 2026-07-26да колдонуучу Fly.io'дун аккаунт-текшерүү (карта, коопсуздук верификациясы) талаптары өтө татаал болгонун белгилеп, **Render.com'дун акысыз tier'ине которулду**. Render'дин акысыз web service'инде persistent disk жок (Fly.io'дон айырмасы) — колдонуучу менен талкууланып, **азырынча ephemeral сактоону кабыл алуу чечилди**: JSON-файлдар `server/data/`де сакталат, бирок ар бир redeploy/restart сайын тазаланат (бардык колдонуучулар/чат жоголот). Бул CLAUDE.mdдеги #2 приоритет ("дайын жоготуу тобокелдиги") менен түз байланышкан — ал бул жерде дароо, "телефон жоголсо" эмес, "сервер кайра иштетилсе" деңгээлинде көрүнөт; чыныгы колдонуучулар үчүн production'го чыгаардын алдында чечилиши МИЛДЕТТҮҪ.

Кодго даярдык: `server/src/dataDir.ts` (JSON-файлдардын жерин `DATA_DIR` env менен которуштурат — Render'де колдонулбайт, бирок келечекте VPS/paid disk'ке которгондо пайдалуу), `server/src/auth.ts`деги production fail-fast (`JWT_SECRET` жок болсо сервер иштебейт), `server/Dockerfile` (Render Docker environment'ын колдойт), `server/render.yaml` (Render Blueprint — repo'до болсо dashboard автоматтык окуйт), жана `src/api/client.ts`теги `EXPO_PUBLIC_API_URL` override.

Кадамдар (browser аркылуу, **колдонуучунун өзү** тарабынан жасалган — Render dashboard'го кирүү/secret коюу Claude Code'дун Bash sandbox'унан мүмкүн эмес, чыныгы desktop браузер менен сессия бөлүшүлбөйт):

1. https://render.com'го GitHub аккаунт менен катталуу/кирүү
2. Dashboard'до **New +** → **Blueprint** → бул репозиторийди тандоо — Render `server/render.yaml`ды окуп, `healthtrack-api` аттуу Docker web service түзөт
3. **JWT_SECRET** env variable'ды толтуруу сурала турган талаага өзүңүз ойлоп тапкан узун кокус сапты коюу (`render.yaml`де `sync: false` менен белгиленген — б.а. git'ке эмес, тек dashboard'го)
4. **Apply**/**Deploy** басуу

**2026-07-26да ишке ашырылды** — деплой ийгиликтүү болду (`server/render.yaml`деги `dockerfilePath`/`dockerContext` башында repo тамырына карата туура эмес эсептелип, "Dockerfile not found" катасы чыккан, экөөнү тең `./server/...`га түздөп оңдолду). Production URL: `https://healthtrack-api-shw7.onrender.com`. Бул URL health-app'тин тамырындагы `.env` файлында `EXPO_PUBLIC_API_URL` катары сакталган (`src/api/client.ts` LAN-IP логикадан мурда буга артыкчылык берет) — демек учурдагы Expo/EAS build'дер (dev-client да, келечектеги production да) баары ушул cloud серверге туташат, локалдуу `npm run dev` серверине эмес.

⚠️ Акысыз tier'де сервер 15 мүнөт активсиз болсо "уктайт" — кийинки сурам ~30-50 секунд "cold start" күтөт. Render'дин акысыз tier шарттары (эрежелер, лимиттер) убакыттын өтүшү менен өзгөрүшү мүмкүн — https://render.com/pricing текшериңиз.

## Cloud'го синхрондоштуруу (Measurements/Profile/Reminders, "Production readiness" #2)

2026-07-26да ишке ашырылды: `MeasurementsContext`, `ProfileContext`, `RemindersContext` эми `AsyncStorage`ден тышкары Render'деги backend'ге дагы синхрондошот (`server/src/userDataStore.ts` — ар бир колдонуучунун `userId` боюнча бир JSON blob'до `{measurements, profile, reminders}` сактайт; `server/src/dataRoutes.ts` — `GET`/`PUT /api/data/{measurements,profile,reminders}`, `requireAuth` менен корголгон). Максат: телефон жоголсо/бузулса, ошол эле аккаунтка жаны түзмөктөн кирип тарыхты калыбына келтирүү.

**Синхрондоштуруу модели — атайылап жөнөкөй, толук эмес:**
- Ар бир мутация (measurement кошуу, profile сактоо, reminder кошуу/өчүрүү/которуштуруу) локалдуу `AsyncStorage`ге жазылгандан кийин, дароо серверге да PUT жиберилет (fire-and-forget — ишке ашпай калса, унчукпай өткөрүлөт, локалдуу копия дагы деле туура болот).
- Колдонуучу кирген/тиркеме ачылган учурда: **эгер бул түзмөктө local дайын бар болсо** — UI'ды тоскоолдотпой, local'ды дароо көрсөтөт, серверди фондо текшерет (Render'дин "cold start" 30-50 секундасы UI'ды бөгөттөбөйт). **Эгер local бош болсо** (жаны/тазаланган түзмөк) — бул чыныгы "телефон жоголду" сценарийи болушу мүмкүн, ошондуктан `loading` серверден жооп келгенге чейин `true` бойдон калат — андан кийин гана `!profile → ProfileSetup` сыяктуу чечим кабыл алынат (антпесе колдонуучу чыныгы профили бар болсо да "ProfileSetup"ко туш болмок).
- **Бул чыныгы conflict-resolution engine эмес** — "акыркы жазуу утат" модели. Эгер эки түзмөк бир аккаунтка бир учурда офлайн туруп өз-өзүнчө өзгөртүү киргизсе, кайсынысы акыркы синхрондошсо, ошол утат (мисалы, local'ы бар түзмөк ачылганда серверди фондо текшерип, эгер сервер бош эмес болсо, local'ды сервердики менен алмаштырат — б.а. "экинчи түзмөк" деп кабыл алат). Максаттуу колдонуучу сценарийи бир аккаунтка бир учурда бир гана түзмөк колдонуу болгондуктан, бул тобокелдик азырынча кабыл алынды.
- **Reminders өзгөчө учур:** `notificationId` OS'тун конкреттүү түзмөгүнө таандык (башка телефондо жараксыз). Ошондуктан жаны/бош түзмөк серверден reminders алганда, ар бирин `scheduleReminderNotification` менен КАЙРА пландайт (`rescheduleForThisDevice()`), жаны notificationId'лерди алат. **Local дайын бар түзмөк серверден reminders'ди эч качан тартып албайт** (тек өзүнүкүн жөнөтөт) — антпесе ар бир app-ачылышта бардык эскертмелер кайра пландалып, эскилери жоголбогондуктан notification'дор эселенип кетмек (бул билинген жана атайылап оолттурулган баг).

Backend жагындагы дайын ошол эле "Cloud'го деплой кылуу" бөлүмүндөгү ephemeral-tradeoff'ко таянат — Render redeploy/restart кылса, бул синхрондоштурулган дайын да жоголот (толук чечим — persistent disk же чыныгы DB, азырынча кабыл алынган эмес).

## Шифрлөө жана сырсөз калыбына келтирүү ("Production readiness" #3)

2026-07-27да ишке ашырылды. (Дарыгер каттоосун лицензия менен текшерүү ошол учурда өзүнчө чоң чечим катары четке коюлган — кийин, 2026-07-30да, төмөндөгү "Дарыгер каттоосун лицензия менен текшерүү" бөлүмүндө ишке ашырылды.)

**Шифрлөө:** `src/storage/secureStorage.ts` — `getItem`/`setItem`/`removeItem` (AsyncStorage менен дал келген интерфейс). Ачкыч (`expo-crypto`теги `getRandomBytesAsync` менен түзүлгөн 256-bit кокус) `expo-secure-store` аркылуу OS keychain/keystore'до сакталат — JS-канчыл эмес, native секретке гана мүмкүнчүлүк. Ар бир жазуу `crypto-js`теги AES-CBC + жаны кокус IV менен шифрленип, `enc1:<ivHex>:<base64>` форматында AsyncStorage'ге жазылат. **Артка шайкештик:** эски (2026-07-27ге чейин жазылган) plaintext JSON дайын `enc1:` префикси жок болгондуктан, `getItem` аны таанып, шифрлебестен кайтарат — колдонуучунун учурдагы дайыны жоголбойт, кийинки `setItem`де автоматтык шифрленет.

**Сырсөз калыбына келтирүү:** Resend (https://resend.com) email API аркылуу — `server/src/email.ts`теги `sendPasswordResetEmail()`. `RESEND_API_KEY` env жок болсо (мис. локалдуу dev), email жөнөтүлбөйт, орду консолго `[dev] password reset code for <email>: <CODE>` деп жазылат — ушундай жол менен email инфраструктурасыз эле агым сыналат. `POST /api/auth/forgot-password` 8 белгилүү кокус код (`ABCDEFGHJKMNPQRSTUVWXYZ23456789` алфавитинен — 0/O/1/I/L алынып салынган, окууга ыңгайлуу үчүн) түзөт, sha256 hash'ин колдонуучунун жазуусуна сактайт (1 саат мөөнөт), эч качан аккаунт бар/жогун ачыкка чыгарбайт (дайыма `{ok:true}`). `POST /api/auth/reset-password` кодду текшерет, сырсөздү жаңыртат, жаны JWT кайтарат — мобилдик тарапта `ResetPasswordScreen` муну `AuthContext.applySession()` менен дароо колдонуучуну кийирет (кайра login кылуунун кереги жок). Мобилдик экрандар: `ForgotPasswordScreen` (email → код сурам), `ResetPasswordScreen` (код+жаны сырсөз).

⚠️ **Чектөөлөр (атайылап жөнөкөйлөтүлгөн):**
- Код 8 белгиден турат, кайра аракет кылууга эч кандай rate-limit жок — теориялык брутфорс тобокелдиги бар (1 сааттык мөөнөт менен азайтылган, бирок толук жок кылынган эмес).
- `RESEND_API_KEY` Render'де `render.yaml`де `sync: false` менен белгиленген — dashboard'до **колдонуучунун өзү** кол менен коюшу керек (Resend'де катталуу, API key алуу). Коюлбаса, forgot-password иштейт, бирок email эч жерге жетпейт (тек server логдо көрүнөт) — production'до колдонулбашы керек, деплой алдында текшерүү милдеттүү.
- Шифрлөө **веб платформада иштебейт** (`expo-secure-store`нин web колдоосу жок) — `Platform.OS === 'web'` учурда `secureStorage` unencrypted `AsyncStorage`ге кайтат. Мобилдик (Android/iOS) — толук шифрленет.
- Шифрлөө "диск/backup'тан түз окулган дайынды" коргойт (мисалы, root'толгон түзмөктөн AsyncStorage файлын түз алуу). Түзмөк ачык турганда (unlocked) тиркеменин өзү иштеп жатканда чабуул кылса (мис. malware), коргоо жок — бул девайс-деңгээлдеги коопсуздук чара, тиркеме-деңгээлиндеги эмес.
- Дарыгер лицензиясын текшерүү 2026-07-30да өзүнчө кошулду — толук деталь төмөндөгү "Дарыгер каттоосун лицензия менен текшерүү (admin панели)" бөлүмүндө.

## Дарыгер каттоосун лицензия менен текшерүү (admin панели)

2026-07-30да ишке ашырылды. Максат — каалаган адамдын "Мен дарыгермин" деп катталып, дароо БАРДЫК пациенттердин билдирүүлөрүн көрүшүнө жол бербөө (мурда ушундай болчу — жогорудагы "Телемедицина жөнүндө эскертүү" бөлүмүн кара). ⚠️ **Бул медициналык лицензияны чыныгы текшерүү эмес** — сүрөттү бир адам (долбоордун ээси) көзү менен карап, "ишеничтүү көрүнөбү" деп чечим кабыл алат. Жасалма/уурдалган документтерди аныктоо механизми жок.

- **SignUp агымы:** `SignUpScreen`де "Мен дарыгермин" тандалганда, лицензия/диплом сүрөтүн `expo-image-picker` (`launchImageLibraryAsync`, `base64: true`) менен галереядан тандоо милдеттүү болот (сүрөт жок болсо `signup.licenseImageRequired` катасы менен тыюу салынат). Сүрөт `data:<mime>;base64,<...>` түрүндө signup сурамына (`licenseDocumentBase64` талаасы) кошулуп жиберилет.
- **Дайын модели:** `server/src/userStore.ts`деги `User`ге `verificationStatus: 'pending' | 'approved' | 'rejected' | null` (`role === 'doctor'` болсо signup'та дароо `'pending'`, пациент үчүн `null`) жана `licenseDocumentBase64: string | null` талаалары кошулду. `POST /api/auth/signup` `role === 'doctor'` болгондо сүрөт жок/бош/өтө чоң (>8MB base64) болсо `400 invalid_input` кайтарат. `express.json()` body limit `10mb`ге чейин көтөрүлдү (демейки 100kb base64 сүрөткө жетишсиз).
- **Admin эндпоинттер (`server/src/adminRoutes.ts`):** `GET /api/admin/pending-doctors` жана `POST /api/admin/doctors/:id/verify` (`{approved: boolean}`) — JWT эмес, жөнөкөй бөлүшүлгөн сыр сөз (`ADMIN_TOKEN` env, `x-admin-token` header'и менен салыштырылат) менен корголгон. ⚠️ **Бул чыныгы access-control система эмес** — бир гана сыр сөз, per-admin аккаунт жок, rate-limiting жок, аракеттер логдолбойт. Токен ким колунда болсо, ошол бардык дарыгерлердин лицензия сүрөттөрүн көрүп, каалаганын ырастай/четке кага алат — токенди сыр сакта.
- **Admin панели:** `GET /admin` — серверден түз берилген жөнөкөй, стилсиз HTML барак (`adminRoutes.ts`деги `ADMIN_PAGE_HTML` сап катары, өзүнчө файл эмес). Токен сурайт (браузердин input'уна кол менен киргизилет, сакталбайт), "Load" басканда pending дарыгерлерди сүрөттөрү менен тизмелейт, ар бирине "Approve"/"Reject" баскычы бар. Мисалы: `https://healthtrack-api-shw7.onrender.com/admin`.
- **Мобилдик жагы:** `AuthUser`ге (`src/api/client.ts`) `verificationStatus` кошулду, signup/login/`/me` жообунда келет. `DoctorInboxScreen` эми `user.verificationStatus !== 'approved'` болсо inbox'тун ордуна "текшерилүүдө" (`doctorInbox.pending`) же "четке кагылды" (`doctorInbox.rejected`) билдирүүсүн көрсөтөт (чат тредтерин такыр сурабайт).
- **Render:** `ADMIN_TOKEN` `render.yaml`га `sync: false` менен кошулду — **колдонуучу өзү** Render dashboard'до узун кокус сапты кол менен коюшу керек (`JWT_SECRET`/`RESEND_API_KEY` сыяктуу эле). Коюлбаса, `requireAdmin` дайыма `401` кайтарат (fail-closed).
- **Ephemeral disk эскертүүсү дагы бул жерге тиешелүү:** жүктөлгөн лицензия сүрөттөрү да `users.json`до, Render'дин ephemeral disk'инде сакталат — server redeploy/restart болсо, алар (жана `verificationStatus`) башка колдонуучу дайыны менен бирге жоголот, дарыгер кайра "pending"тен баштайт.

## Автоматтык тесттер (Jest, "Production readiness" #4)

2026-07-29да ишке ашырылды (тек таза-логика функциялары), 2026-08-03тө component/screen/context тесттери менен толукталды. Эки өз-өзүнчө Jest орнотуусу бар (`health-app/` жана `server/` — экөө тең өз алдынча npm проектери болгондуктан):

- **`health-app/jest.config.js`** — эми **эки Jest "project"** бар (`npm test` экөөнү тең бир жолу иштетет):
  - `logic` — `ts-jest`, `testEnvironment: 'node'`, `src/**/*.test.ts` гана (таза-логика функциялары, React/RN'ге такыр тийбейт).
  - `components` — `jest-expo` preset (`babel-preset-expo` аркылуу, тамырда `babel.config.js` кошулду — мурда жок болчу), `src/**/*.test.tsx` гана, `@testing-library/react-native` менен. `jest.setup.components.js` бул проекттин `setupFilesAfterEnv`инде — `@react-native-async-storage/async-storage`ди расмий jest-mock'у менен алмаштырат.
- **`server/jest.config.js`** — өзгөргөн жок, `ts-jest`, `server/src/**/*.test.ts`.

**Тестелген функциялар/компоненттер жана тест саны (баары өтөт — `health-app`де `54` тест 8 файлда + `server`де `5` тест 1 файлда = **`59` тест, 9 файл**):**
- `src/data/insights.ts` → `classify()` — 11 тест: кан басым/пульс/SpO2 үчүн `good`/`watch`/`concern` чектери, анын ичинде так чек маанилери (мис. 90/60, 140/90).
- `src/data/sleep.ts` → `inferSessions()` жана `formatDurationParts()` — 9 тест: 3 сааттык минимум, 45 мүнөттүк gap-толеранттуулук (так чегинде бирикет, andan ашса бөлүнөт), "still эмес" сэмпл сессияны бүтүрөт, көп сессия акыркысынан баштап сорттолот, сэмплдер irети менен эмес берилсе да иштейт.
- `src/data/reminderLog.ts` → `weeklyStats()` — 5 тест: `reminderId` боюнча чыпкалоо, 7 күндүк cutoff, `taken`/`total` эсептөө.
- `src/ble/gatt.ts` → `parseSFloat()` (тестирлөө үчүн `export` кылынды, мурун private болчу), `parseBloodPressureMeasurement()`, `parsePulseOximeterMeasurement()` — 16 тест: IEEE-11073 SFLOAT'тун оң/терс мантисса, оң/терс экспонента, NaN sentinel (0x07FF) учурлары; байт-деңгээлдеги пакеттер (флагдар, milдеттүү эмес timestamp которуштуруу, кыска буфер, милдеттүү эмес талаалардын жоктугу) кол менен курулган base64 пакеттер менен текшерилди.
- **`src/screens/LoginScreen.test.tsx`** (жаны, 4 тест) — **`LoginScreen`деги 2026-07-30дагы role-багыттоо багынын регрессия-тести**: дарыгер аккаунту менен кирсе `DoctorInbox`ко, профили бар пациент `Dashboard`ко, профили жок пациент `ProfileSetup`ко багытталат; login катачылык кайтарса эч кайда багытталбайт. `useAuth`/`useProfile` толугу менен `jest.mock`ленген (чыныгы `AuthContext`/`ProfileContext`/API'ге такыр тийбейт), `ThemeProvider`/`SettingsProvider`/`LocaleProvider` чыныгы (алар жөн гана `AsyncStorage`ди окуйт, ал mock'толгон).
- **`src/screens/SignUpScreen.test.tsx`** (жаны, 3 тест) — "Мен дарыгермин" тандалып, лицензия сүрөтү жүктөлбөсө `signup.licenseImageRequired` катасы менен тыюу салынары (`signup()` чакырылбайт); лицензия сүрөтү тандалгандан кийин `signup()` туура `licenseDocumentBase64` менен чакырылып, `DoctorInbox`ко багытталары; пациент катары `ProfileSetup`ко багытталары. `expo-image-picker` толугу менен mock'толгон. Бул тесттер үчүн `SignUpScreen.tsx`гa `testID`лар кошулду (`signup-email`, `signup-password`, `signup-doctor-toggle`, `signup-license-picker`, `signup-submit` — `LoginScreen`деги мурунтан бар конвенцияга дал келет).
- **`src/context/RemindersContext.test.tsx`** (жаны, 3 тест) — `addReminder` эскертмени тизмеге кошуп, notification'ду пландап, cloud'го синхрондоштурары; `toggleReminder` `false`/`true`де notification'ду тийиштүү түрдө жокко чыгарып/кайра пландай тары; `deleteReminder` тизмеден алып, notification'ду жокко чыгарары. `../notifications/reminderNotifications`, `../storage/secureStorage`, `../api/client`, `./AuthContext`, `./LocaleContext` баары `jest.mock`ленген (чыныгы серверге, `expo-notifications`ке, `expo-secure-store`го такыр чыкпайт).
- **`src/theme/typography.test.ts`** (жаны, 3 тест) — `buildTypography(scale)`: `scale=1` базалык токендерге дал келери, `scale=1.25`де `fontSize`/`lineHeight`дин туура тегеректелип чоңойору (мис. `body`: 15→19px), `fontWeight`дин өзгөрбөй тургандыгы.
- `server/src/auth.ts` → `signToken()`/`verifyToken()` — 5 тест: round-trip, ар башка `userId`лердин алдырылбашы, жалган/бузук токен четке кагылышы, башка сыр сөз менен колтамгаланган токен четке кагылышы, мөөнөтү өткөн токен четке кагылышы.

⚠️ **Орнотуу учурунда кездешкен готчалар (кайра жолукса эске):**
- `jest@30` менен `react-native@0.81`нин транзитивдик көз карандылыгы (`jest-environment-node@29.7.0`) ортосунда версия конфликти чыккан (`TypeError: this._moduleMocker.clearMocksOnScope is not a function`). Чечими — `health-app/package.json`гa `"overrides": {"jest-environment-node": "30.4.1"}` кошуу (npm overrides, бир версияны бүт дарактын боюна мажбурлайт).
- `@testing-library/react-native@latest`ти орноткондо `react-test-renderer` эң жаны версиясын (`react@^19.2.8` талап кылган) тартып, долбоордогу `react@19.1.0` менен conflict чыгарган. Чечими — `react-test-renderer@19.1.0`ду так версия менен `devDependencies`ке кошуу (бул `jest-expo@54.0.17`нин өзү ичинде колдонгон версиясы менен дал келет).
- `jest.mock('../module', () => ({ fn: someOuterMockVar }))` түрүндөгү **түз** шилтеме (wrapper-функциясыз) кээде "Cannot access '...' before initialization" катасына алып келди — Babel'дин jest-hoist плагини `jest.mock()` чалууларын import'тордун да үстүнө жылдырат, ал эми `const mockXxx = jest.fn(...)` өзү жылдырылбайт, натыйжада factory retro (module) эрте, `mockXxx` али инициализацияланбаган кезде аткарылып калат. Чечими — factory ичинде **wrapper-функция** колдонуу: `fn: (...args) => mockXxx(...args)` (lazy шилтеме, мурункусундай эле пайдалуу, бирок TDZ'ге кабылбайт).
- `jest-expo`нун ички `babel-preset-expo` пакетин колдонуу үчүн тамырда **`babel.config.js` болушу керек** (мурда жок болчу — Metro өзү аны эмне үчүндүр талап кылбай эле иштеп жаткан, бирок Jest'тин `babel-jest` трансформу муну эксплициттүү издейт). Кошулду: `module.exports = function(api) { api.cache(true); return { presets: ['babel-preset-expo'] }; };`.

**Дагы эле жок:** integration тесттер (мисалы, чыныгы HTTP сурам менен `server/`ди сыноо), E2E тесттер (Detox/Maestro). Калган screen/context'тер (Dashboard, History, Insights, MeasurementsContext ж.б.) дагы эле тестирленген эмес — өзүнчө тапшырма катары каралышы керек.

## Чоң тамга/жогорку контраст режими ("Production readiness" #5дин биринчи бөлүгү)

2026-08-03тө ишке ашырылды. `SettingsContext`ке эки жаны талаа кошулду: `largeText: boolean` жана `highContrast: boolean` (экөө тең дефолт `false`, `health-app/settings`те бирге сакталат). `SettingsScreen`де "Жеткиликтүүлүк" бөлүмүндө эки `AccessibilityToggleRow` (жаны компонент, `SettingsLinkRow`дун стилине дал келет, `Switch` менен) — `ThemeModeSelector`дон кийин, тил тандагычтан мурда жайгашкан.

- **Чоң тамга:** `src/theme/typography.ts`теги `buildTypography(scale)` бардык типографика деңгээлдеринин (`h1`...`small`) `fontSize`/`lineHeight`ин пропорционалдуу чоңойтот (бүтүн пикселге тегеректелет), `fontWeight`ди өзгөртпөйт. `ThemeProvider` `settings.largeText === true` болсо `1.25`x коэффициент менен чакырат (`h1`: 22→28px, `body`: 15→19px). Бул таза функция, `src/theme/typography.test.ts`те тестирленген.
- **Жогорку контраст:** `src/theme/colors.ts`ке `lightHighContrast`/`darkHighContrast` палитралары кошулду — семантикалык (danger/warning/success) карточкалардын ачык тондолгон (pastel) фондору (`dangerBg` ж.б.) алынып, таза ак/кара фонго алмаштырылды (себеби: кадимки палитрада мис. `danger` fg'синин `dangerBg` фонуна карата контраст катышы ~2.8:1 — WCAG AA'нын 4.5:1 чегине жетпейт), ал эми fg-түстөр (`danger`/`warning`/`success`) фонго (ак же кара) карата жетиштүү контраст берерлик кылып тандалды (мис. `#B00020` ак фондо ~7.5:1). `ThemeProvider.buildTheme()` `settings.highContrast === true` болсо ушул палитраларды тандайт (light/dark темага жараша). `VitalCard` жогорку контраст режиминде тон-түстүү 2px чек ара кошот (`highContrast` — эми `Theme` объектисинин талаасы, `useTheme()` аркылуу бардык компонентке жеткиликтүү), антпесе фондор такыр окшош (ак/ак) болуп, карточкалардын ортосундагы айырма жоголот.
- Семантикалык маани дайыма эле түс менен катар иконка/текст боюнча да берилет (`dizayn-sistema.md`деги Жеткиликтүүлүк эрежеси), ошондуктан фондорду жөнөкөйлөтүү маалыматтык жоготууга алып келбейт.

⚠️ **Дагы эле жок:** биринчи ачылуудагы onboarding (item 5дин экинчи бөлүгү — өзүнчө тапшырма катары каралышы керек). Чоң тамга режими UI layout'ту бузбай тургандыгы бардык экрандарда кол менен (браузерде/түзмөктө) визуалдык текшерилген эмес — токен-деңгээлиндеги өзгөртүү тыгыз орун калтырган жерлерде (мис. кыска баскычтар, көп сап текст) кесилип калуу тобокелдиги теориялык жактан бар.

## Папка структурасы (иш жүзүндөгү)

```
health-app/
  App.tsx
  index.ts
  app.json
  babel.config.js    — babel-preset-expo (2026-08-03тө кошулду, jest-expo'го керек)
  jest.config.js     — эки "project": `logic` (ts-jest, src/**/*.test.ts) жана `components` (jest-expo preset, src/**/*.test.tsx)
  jest.setup.components.js — `components` проектинин setupFilesAfterEnv'и, AsyncStorage'ди mock'тойт
  src/
    api/             — client.ts (fetch wrapper + LAN base URL), errors.ts (ApiErrorCode → TranslationKey)
    ble/             — gatt.ts (стандарттуу BLE UUID'лар + IEEE-11073 SFLOAT парсинг, native модулго көз каранды эмес; gatt.test.ts бар)
    sleep/           — sleepSampling.ts (background task definition + акселерометр өлчөө)
    components/     — Button, TextField, VitalCard, MeasurementIcon, ReminderIcon, ReminderListItem, ThemeModeSelector, LanguageSelector, MedicalDisclaimer, SettingsLinkRow, ClearDataSection, AccessibilityToggleRow (чоң тамга/жогорку контраст toggle'дору)
    context/         — MeasurementsContext, ProfileContext, RemindersContext (RemindersContext.test.tsx бар), ReminderLogContext, SettingsContext, LocaleContext, AuthContext, EmergencyContactsContext, BleContext, StepsContext, SleepContext, ComposeProviders
    data/            — measurements.ts, profile.ts, reminders.ts, reminderLog.ts, insights.ts, emergencyContacts.ts, sos.ts, steps.ts, sleep.ts (типтер + форматтоо/эсептөө функциялары; көрсөтүлүүчү тексттер эмес — алар i18n'де; insights/sleep/reminderLog'дун `*.test.ts` файлдары бар)
    i18n/            — ky.ts (канондук), ru.ts, en.ts
    navigation/       — RootNavigator.tsx
    notifications/    — reminderNotifications.ts, thresholdAlerts.ts
    screens/          — Login (LoginScreen.test.tsx бар), SignUp (SignUpScreen.test.tsx бар), ForgotPassword, ResetPassword, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings, SOS, EmergencyContacts, AddEmergencyContact, Chat, DoctorInbox, Bluetooth, Sleep
    storage/          — secureStorage.ts (AsyncStorage'ди AES-шифрлөө менен ороп турган wrapper)
    theme/            — colors (light/dark + lightHighContrast/darkHighContrast), typography (buildTypography(scale), typography.test.ts бар), spacing, radii, ThemeProvider
  server/            — локалдуу Express auth+chat сервери (өз package.json'у, health-app'тин ичине кирбейт)
    Dockerfile        — cloud деплой үчүн (Render Docker environment), `npm install` + `tsx` менен иштетет
    render.yaml        — Render Blueprint (dashboard'до "New + Blueprint" ушуну автоматтык окуйт)
    jest.config.js     — ts-jest, server/src/**/*.test.ts гана
    src/
      index.ts        — listen(0.0.0.0:PORT)
      app.ts           — Express app + auth routes (signup/login/me/forgot-password/reset-password)
      authMiddleware.ts — requireAuth (app.ts менен chatRoutes.ts экөө тең колдонот)
      chatRoutes.ts     — /api/chat/* (requireDoctor гейт менен)
      dataRoutes.ts      — /api/data/{measurements,profile,reminders} (GET/PUT, requireAuth менен)
      adminRoutes.ts     — /admin (HTML панель) + /api/admin/{pending-doctors,doctors/:id/verify} (ADMIN_TOKEN менен корголгон)
      auth.ts          — JWT sign/verify, production'до JWT_SECRET жоктон fail-fast; auth.test.ts бар
      email.ts          — Resend аркылуу сырсөз калыбына келтирүү коду жиберет (RESEND_API_KEY жок болсо консолго логдойт)
      dataDir.ts        — JSON-файлдардын жайгашкан жерин аныктайт (`DATA_DIR` env же дефолт `data/`)
      userStore.ts      — users.json'го окуу/жазуу (role, resetCodeHash/resetCodeExpiresAt, verificationStatus/licenseDocumentBase64 талаалары менен)
      chatStore.ts      — messages.json'го окуу/жазуу
      userDataStore.ts   — userData.json'го окуу/жазуу (userId боюнча measurements/profile/reminders blob)
```

## Дайын модели (учурда)

`Measurement` (`src/data/measurements.ts`) — үч түрдө, discriminated union:
- `{ type: 'bloodPressure', systolic, diastolic }`
- `{ type: 'pulse', bpm }`
- `{ type: 'spo2', percent }`

Ар бирине `id`, `createdAt` (timestamp) кошулат. `measurementMeta` tone (danger/warning/success) аныктайт; label эми `data/`де эмес, `t('measurement.<type>')` аркылуу `i18n`ден алынат.

## Код жазуу эрежелери

- TypeScript милдеттүү — `any` колдонбоо
- Дизайн токендерин колдонуу — түстү/аралыкты түз жазбоо, `src/theme`ден алуу (мисалы `#185FA5` эмес, `theme.colors.primary`)
- Ар бир context'тин өз `STORAGE_KEY`си бар, жаны context кошсоңуз `health-app/<домен>` форматын сакта
- Жаны экран кошсоңуз `RootNavigator.tsx`деги `RootStackParamList`ге да кошуу керек
- Компонент өлчөмү — 200 сапттан ашпашы керек
- Комментарий — татаал логикага гана
- UI тексттерди экрандын/компоненттин ичине түз жазбоо — `src/i18n/ky.ts`ге ачкыч кош, `ru.ts`/`en.ts`ге котормосун да кош, экранда `useLocale()`дон алынган `t('namespace.key')` менен колдон. Жаны ачкыч кошсоң үчөө тең (ky/ru/en) бирге жаңылансын — `ru.ts`/`en.ts` `Record<TranslationKey, string>` болгондуктан бирөө жетишпесе TypeScript катачылык берет.

## MVP чөйрөсүнөн чыкпоо

CLAUDE.mdде баштапкы белгиленген бардык "кийинки фазалар" (i18n, backend/auth, SOS, телемедицина, Bluetooth, проактивдүү эскертүү, дары ичкенди ырастоо, кадам эсептегич, уйку эсептегич) ишке ашырылды — жогорудагы тиешелүү бөлүмдөрдү кара. Backend азырынча **тек локалдуу** — cloud'го deploy кылынган эмес, production'го чыгаруу өзүнчө чоң чечим.

**"AI-анализ" жөнүндө эскертүү:** `InsightsScreen` (`quickLink.insights` → "Талдоо") жана `src/data/insights.ts` чыныгы AI/ML эмес — сакталган өлчөөлөрдү стандарттык медициналык диапазондорго салыштырган локалдуу эвристика (`computeInsights`: `good`/`watch`/`concern` статусу + мурунку жазуу менен салыштырылган тренд). Тармакка чыгуу, LLM чакыруу жок. UI тексттеринде "AI" деп аталбайт — колдонуучуну алдабоо үчүн.

**"SOS/үй-бүлөлүк көзөмөл" жөнүндө эскертүү:** Ишке ашкан бөлүгү — SOS (`SOSScreen`, `EmergencyContactsContext`, `src/data/sos.ts`): колдонуучу шашылыш байланыштарын локалдуу сактайт, "SOS жиберүү" баскычы `expo-sms` менен native SMS composer'ду (же SMS жеткиликсиз болсо `tel:` аркылуу чалуу) акыркы көрсөткүчтөр менен ачат. **Чыныгы "үй-бүлөлүк көзөмөл" (family member башка түзмөктөн/аккаунттан бул колдонуучунун дайын-дарегин алыстан көрүшү) ишке ашкан эмес** — ал үчүн backend'ди measurements/profile'ды колдонуучу боюнча сактап, бөлүшүү/уруксат механизмин кошуу керек болот (өзүнчө чоң чечим, учурдагы `server/`нин auth-гана масштабынан чыгат).

⚠️ `SOSScreen.tsx`деги `tel:` fallback `Platform.OS !== 'web'` менен корголгон — веб браузерде (десктоп Chrome/Windows) `tel:` ачууга аракет "Open Phone Link?" сыяктуу native OS диалогун чакырат, ал бүтүндөй браузер терезесинин focus'ун талап кылат (`document.visibilityState` `hidden` болуп калат, андан аркы CDP/screenshot аркылуу текшерүү мүмкүн болбой калат). Мобилдик түзмөктө мындай көйгөй жок — `tel:` түз Телефон колдонмосун ачат.

**"Телемедицина" жөнүндө эскертүү:** Video/аудио чалуу жок — **тек текст чат**, `ChatScreen`/`DoctorInboxScreen`/`server/src/chatStore.ts` аркылуу. Poll'доо менен (3 сек интервал) "реалдуу убакытка жакын" эффект түзүлөт, WebSocket жок. **Дарыгер каттоосу 2026-07-30дан баштап жөнөкөй admin-текшерүү менен корголгон** (толук деталь — жогорудагы "Дарыгер каттоосун лицензия менен текшерүү" бөлүмүн кара): SignUp'та "Мен дарыгермин" тандаган адам лицензия/диплом сүрөтүн жүктөшү керек, аккаунт долбоордун ээси кол менен ырастаганга чейин `DoctorInbox`ко кире албайт. **Бирок бул чыныгы медициналык лицензия-текшерүү системасы эмес** — сүрөттү бир адам көзү менен карайт, жасалма документти аныктоо кепилдиги жок. Бир дарыгер ырасталса, ал БАРДЫК пациенттердин билдирүүлөрүн көрөт жана жооп бере алат (пациент конкреттүү дарыгер тандабайт, дарыгер-пациент тиешелүү бөлүштүрүү жок — бирдиктүү inbox модели).

**Bluetooth жөнүндө эскертүү:** `src/ble/gatt.ts`деги парсинг Bluetooth SIG'дин расмий Blood Pressure Service (0x1810) жана Pulse Oximeter Service (0x1822) спецификацияларына негизделген (стандарттуу IEEE-11073 SFLOAT форматы). Build процесси EAS Build (cloud) аркылуу мүмкүн болду (локалдуу Android SDK жок), `eas login`/`eas build` командаларын **колдонуучунун өзү** өз терминалында иштеткен — Expo access token эч качан Claude'дун Bash куралы аркылуу өтпөгөн (эки жолу ката коркунуч болгон, б.а. token чат билдирүүсү катары кокустан жиберилген, экөө тең revoke кылынган). Курулган dev client'ти чыныгы Android телефонго орнотуп, `BleContext.startScan()` иштээри 2026-07-26да **ырасталды** (жакын жердеги "Haier" аттуу BLE түзмөгү табылды). **Бирок:** `connect()`/`monitorCharacteristicForService()` жана GATT парсинг (`parseBloodPressureMeasurement`/`parsePulseOximeterMeasurement`) чыныгы медициналык түзмөк (тонометр/пульсоксиметр) менен эч качан текшерилген эмес — колдо андай түзмөк болгон эмес. Эгер ошондой түзмөк табылса, биринчи иш — `subscribeToKnownServices`деги эки характеристиканын да чын элеле notify берип жатканын жана `parseSFloat`дин туура маани кайтарып жатканын текшерүү.

**"Проактивдүү эскертүү" жөнүндө эскертүү:** Босого — `src/data/insights.ts`теги `classify()` менен аныкталат (`concern` статусу). Notification уруксаты сурала турган өзүнчө UI жок — тиркеме мурунтан эле `expo-notifications` уруксатын сурап алса гана иштейт, жок болсо унчукпай эч нерсе жасалбайт (колдонуучуга "уруксат жок" деген эскертүү да көрсөтүлбөйт).

**"Дары ичкенди ырастоо" жөнүндө эскертүү:** `snoozed` статусу ишке ашкан эмес — жалгыз эки вариант `taken`/`skipped`. Notification action баскычтары (`opensAppToForeground: false`) тек Android/iOS'до иштейт, web'де категория деле түзүлбөйт (`Platform.OS === 'web'` учурда `configureAdherenceCategory` эч нерсе кылбайт).

**"Кадам эсептегич" жөнүндө эскертүү:** iOS'до так (`Pedometer.getStepCountAsync` тарыхый маалымат берет), бирок **Android'до так эмес** — `watchStepCount()` delta-негизделген API, тиркеме фондо/жабык турганда эсептебейт (OS тиркемени өлтүрсө, ошол аралыктагы кадамдар такыр эсепке кирбейт). `ACTIVITY_RECOGNITION` уруксаты сурала турган өзүнчө UI жок, Expo'нун демейки `Pedometer` жүрүм-турумуна таянылат.

**"Cloud'го синхрондоштуруу" жөнүндө эскертүү:** Толук деталь — жогорудагы "Cloud'го синхрондоштуруу (Measurements/Profile/Reminders)" бөлүмүн кара. Кыскача: бул **бир багыттуу "акыркы жазуу утат" синхрондоштуруу**, чыныгы conflict-resolution engine эмес — эки түзмөк бир аккаунтка бир учурда офлайн туруп өзгөртүү киргизсе, биринин өзгөртүүсү жоголушу мүмкүн. Максаттуу сценарий так ошол эмес — "телефон жоголду/бузулду, жаны телефондо ошол эле аккаунтка кирип тарыхты калыбына келтирүү" гана.

**"Уйку эсептегич" жөнүндө эскертүү:** Бул эң эксперименталдык бөлүк. `expo-background-task`деги `minimumInterval: 15` (мүнөт) — **гарантия эмес, сунуш гана**; Android/iOS батарея-үнөмдөө саясаттарына жараша OS бул тапшырманы саат бою же андан көп мезгилге чейин токтото алат, же такыр иштетпей коюшу мүмкүн. Бул себептен фондук аткарылуу бир сессия ичинде текшерилген эмес — `SleepScreen`деги "Азыр текшерүү" баскычы аркылуу гана өлчөө/классификация логикасынын өзү (акселерометр дисперсиясы → `still`/эмес) текшерилди. Так уйку эмес, "телефон 3+ саат кыймылсыз жатты" эвристикасы гана — телефон колдо эмес же зарядкада башка бөлмөдө жатса, туура эмес натыйжа берет.

## Production readiness — чыныгы колдонуучу үчүн жетишсиз жерлер (пландалган, приоритети боюнча)

Колдонуучу менен 2026-07-26да талкууланды: бардык MVP+кийинки-фаза функциялары "бүттү" болгону менен, тиркеме дагы эле **чыныгы колдонуучу колдоно турган продукт эмес** — прототип. Приоритети боюнча (жогорку — эң маанилүү, калгандары ушуга көз каранды):

1. ✅ **Backend cloud'го deploy кылуу — 2026-07-26да бүттү:** Render.com'дун акысыз tier'ине деплой болду (`https://healthtrack-api-shw7.onrender.com`), `EXPO_PUBLIC_API_URL` аркылуу мобилдик тиркеме ушул URL'ге туташат (толук деталь — жогорудагы "Cloud'го деплой кылуу (Render.com)" бөлүмүн кара). **Бирок бул толук чечим эмес** — Render'дин акысыз tier'инде persistent disk жок, JSON-файл сактоо ephemeral (ар бир redeploy/restart сайын бардык колдонуучулар/чат жоголот). Бул #2 пункттагы "дайын жоготуу тобокелдиги" менен кошулуп, чыныгы колдонуучулар келгенде чечилиши МИЛДЕТТҮҪ (persistent disk бар hosting'ке которуу же чыныгы DB'ге өтүү).
2. ✅ **Дайын жоготуу тобокелдиги — 2026-07-26да негизи ишке ашырылды:** Measurements/Profile/Reminders эми Render'деги backend'ге дагы синхрондошот (толук деталь — жогорудагы "Cloud'го синхрондоштуруу" бөлүмүн кара). **Бирок толук чечим эмес** — (a) синхрондоштуруу "акыркы жазуу утат" модели, чыныгы conflict-resolution жок; (b) backend дайыны Render'дин ephemeral disk'инде — server redeploy/restart болсо, синхрондошкон дайын да жоголот (#1 пункттагы эскертүү менен түз байланышкан). Толук чечим үчүн persistent disk/чыныгы DB'ге которуу керек.
3. ✅ **Коопсуздук — 2026-07-27да ишке ашырылды, 2026-07-28де чыныгы телефондо колдонуучу тарабынан ырасталды:** AsyncStorage'дагы медициналык дайын (Measurements/Profile/Reminders/ReminderLog) эми `secureStorage` менен AES шифрленет (OS keychain/keystore'до сакталган ачкыч менен), жана чыныгы email-негизделген сырсөз калыбына келтирүү (Resend) кошулду — толук деталь жогорудагы "Шифрлөө жана сырсөз калыбына келтирүү" бөлүмүндө. Эки функция тең EAS dev-client build'да чыныгы Android телефондо сыналып, иштээри ырасталды (tunnel режими аркылуу туташуу — LAN режими роутердин белгисиз себеп менен блоктошунан улам иштебей калган). **"Мен дарыгермин" checkbox'ун лицензия менен текшерүү 2026-07-30да кошулду жана толук end-to-end ырасталды** (жөнөкөй admin-панель аркылуу: каттоо → лицензия сүрөтүн жүктөө → admin "Approve" → кайра кирүү → Inbox'ко автоматтык чыгуу — толук деталь жогорудагы "Дарыгер каттоосун лицензия менен текшерүү" бөлүмүндө). Бул процессте табылган жана оңдолгон баг: `LoginScreen.tsx`деги `handleLogin()` мурда `user.role`ду текшербестен ар дайым Dashboard/ProfileSetup'ко багыттачу (SignUpScreen'ден айырмаланып) — дарыгер аккаунту **катталганда** туура иштечү, бирок **кайра киргенде** ар дайым туура эмес пациент экранына кетчү. Оңдолду: `AuthContext.login()` эми `AuthUser`ды кайтарат, `LoginScreen` ошону колдонуп role'го жараша багыттайт. Бирок дарыгер-текшерүү системасынын өзү дагы деле толук чечим эмес — бир гана `ADMIN_TOKEN` сыр сөзү менен корголгон, чыныгы медициналык лицензия-текшерүү эмес (бир адам көзү менен карайт). **Дагы деле чечилбеген:** `JWT_SECRET`дин dev-only дефолт мааниси (production fail-fast менен корголгон, бирок толук эмес); reset-код'до жана `ADMIN_TOKEN`до rate-limiting жок.

⚠️ **EAS build профилдери жөнүндө маанилүү сабак (2026-07-30):** `development` профили (dev-client) ар дайым Metro серверине (компьютерге) тирүү туташуу талап кылат — телефон/компьютер LAN'да AP isolation же башка тармак көйгөйүнө байланыштуу туташа албай калганда, бул чоң тоскоолдук болду. Чечим — `eas.json`ге `preview` профилин кошуу (JS кодду APK'нын ичине түз "бышырат", эч кандай Metro/USB/tunnel талап кылбайт, өз алдынча иштейт). Мунун өзүндө да бир жолку көйгөй болду: `EXPO_PUBLIC_API_URL` `.env`ден автоматтык окулган жок (себеби так аныкталган эмес), андан улам колдонмо туура эмес URL'ге туташууга аракет кылды — чечим катары ушул env-маанини `eas.json`деги `development` жана `preview` профилдеринин экөөнө тең `"env": {...}` талаасы аркылуу ачык-так жазуу болду (`.env`ге автоматтык таянуунун ордуна). Келечекте жаны EAS build профилдерин кошсоңуз, ушул эле үлгүнү колдонуңуз.
4. 🔶 **Ишенимдүүлүк — 2026-07-29да таза-логика функциялары менен башталды, 2026-08-03тө component/screen/context тесттери менен уланды:** Эң критикалуу таза-логика функцияларына (`classify`, `inferSessions`, `weeklyStats`, BLE SFLOAT/пакет парсинг, JWT sign/verify) Jest unit-тесттери жазылды, андан кийин `@testing-library/react-native` (`jest-expo` preset менен) орнотулуп, `LoginScreen` (2026-07-30дагы role-багыттоо багынын регрессия-тести), `SignUpScreen` (дарыгер лицензия-сүрөт талабы + туура ролго багыттоо) жана `RemindersContext` (`addReminder`/`toggleReminder`/`deleteReminder`) үчүн тесттер кошулду — жалпы `56` тест, 8 файл (`health-app`де 51/7, `server`де 5/1), баары өтөт (толук деталь жогорудагы "Автоматтык тесттер (Jest)" бөлүмүндө). **Дагы эле жок:** калган screen/context'тер (Dashboard, History, Insights, MeasurementsContext ж.б.), integration/E2E тесттер. Android'до (Xiaomi/Huawei ж.б. батарея-үнөмдөө агрессивдүү бренддерде) фондук эскертмелер/уйку-трекинг дагы эле чыныгы шарттарда тестирленген эмес (жогорудагы эскертүүлөрдү кара — "Уйку эсептегич", "Кадам эсептегич").
5. 🔶 **Улгайган колдонуучуга ылайыктоо — 2026-08-03тө башталды (чоң тамга/жогорку контраст бөлүгү бүттү):** `Settings`ке эки жаны toggle кошулду (толук деталь төмөндөгү "Чоң тамга/жогорку контраст режими" бөлүмүндө). **Дагы эле жок:** биринчи ачылууда түшүндүрүү (onboarding) — CLAUDE.mdдеги максаттуу аудитория ("орто жаштагы жана улгайган колдонуучулар") менен дагы деле дал келбеген бөлүк, кийинки кезекте.
6. 🔶 **Play Store'го чыгарууга даярдык — 2026-07-30да башталды:** Купуялык саясаты жана пайдалануу шарттары кыргызча жазылды (`legal/privacy-policy.ky.md`, `legal/terms-of-service.ky.md` — юридикалык консультация эмес, расмий жарыялаардын алдында юрист карашы сунушталат). GitHub Pages аркылуу публикалык URL'ге жарыяланды: **https://akun-7.github.io/health-app/privacy-policy.html** жана **https://akun-7.github.io/health-app/terms-of-service.html** (`docs/` папкасынан, `master` бранчынан). Бул үчүн репозиторий **private'дан public'ке которулду** (2026-07-30) — мурда git тарыхында эч кандай сыр/чыныгы колдонуучу дайыны коммит болуп калбаганы текшерилди (`.env` тек публикалык API URL камтыйт, `server/data/*.json` эч качан tracked болгон эмес), андан кийин `.gitignore`ге келечектеги кокус secret-commit'терге каршы кошумча `.env*` эрежеси кошулду. `SettingsScreen`ге ("Юридикалык маалымат" бөлүмүнө) эки жаны `SettingsLinkRow` кошулду — "Купуялык саясаты" жана "Пайдалануу шарттары", экөө тең `Linking.openURL` менен жогорудагы эки URL'ди тышкы браузерде ачат. **Дагы эле жок:** англисче/орусча котормо (үчөө тең азырынча ошол эле кыргызча барактарга шилтейт), жана Play Console'до расмий түрдө URL коюу (бул кадам эч качан жасалган эмес).

Бул тизмеге эч бир код жазылган жок — CLAUDE.mdге белгиленди, ар бир пункт Claude Code'го өзүнчө, ирети менен (1ден баштап) тапшырма катары берилиши керек.

## Эскертүү

Бул медициналык маалымат менен иштеген тиркеме — колдонуучуга көрсөтүлгөн ар бир медициналык маалымат экранында "Бул медициналык диагноз эмес" деген эскертүү болушу сунушталат.
