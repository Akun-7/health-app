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
  - `MeasurementsContext` → `health-app/measurements` (2026-07-26дан баштап cloud'го дагы синхрондошот — төмөндөгү "Cloud'го синхрондоштуруу" бөлүмүн кара)
  - `ProfileContext` → `health-app/profile` (cloud sync бар, жогорудагыдай эле)
  - `RemindersContext` → `health-app/reminders` (cloud sync бар, notification'дор дагы эле локалдуу)
  - `ReminderLogContext` → `health-app/reminderLog` (дары/эскертме аткарылуу тарыхы: `taken`/`skipped` + убакыт)
  - `SettingsContext` → `health-app/settings`
  - `LocaleContext` → `health-app/locale`
  - `AuthContext` → `health-app/authToken` (JWT гана сакталат; `user` объектиси серверден `/api/auth/me` менен алынат)
  - `EmergencyContactsContext` → `health-app/emergencyContacts`
  - `StepsContext` → `health-app/steps` (учурдагы күндүн кадам саны)
  - `SleepContext` → (өзү сактабайт, `src/sleep/sleepSampling.ts`деги `health-app/sleepSamples`ди окуйт)
  - **Zustand, Redux, Prisma, PostgreSQL — колдонулбайт.** (Мурунку талкууда сунушталган, бирок иш жүзүндө башка жол тандалган.)
- **Backend/auth:** `server/` — Express + TypeScript, `tsx` менен иштейт (`npm run dev` — `server/`дин ичинде). Колдонуучулар `server/data/users.json` файлында сакталат (JSON, native DB эмес — `better-sqlite3` бул машинада Visual Studio Build Tools жоктугунан compile болбойт, ошондуктан колдонулбайт). JSON-файлдын жайгашкан жери `server/src/dataDir.ts`теги `dataFilePath()` аркылуу аныкталат — дефолт `server/data/`, бирок `DATA_DIR` env коюлса ошол жерге жазат (cloud'до persistent volume'го көрсөтүү үчүн). Пароль `bcryptjs` менен hash'делет, сессия `jsonwebtoken` (`JWT_SECRET` env; локалдуу dev'де дефолт туруктуу сыр сөз колдонулат, бирок `NODE_ENV=production`де `JWT_SECRET` жок болсо сервер асти иштебей, дароо катачылык менен токтойт — `server/src/auth.ts`). Ар бир колдонуучунун `role: 'patient' | 'doctor'` талаасы бар (signup'та тандалат, эч кандай текшерүү жок). Эндпоинттер: `POST /api/auth/signup` (`{email,password,role?}`), `POST /api/auth/login`, `GET /api/auth/me` (`Authorization: Bearer <token>`); чат — `GET/POST /api/chat/messages` (пациенттин өз thread'и), `GET /api/chat/threads` (дарыгер-гана, бардык пациенттердин тизмеси), `GET/POST /api/chat/messages/:patientId` (дарыгер-гана, белгилүү пациенттин thread'и). `requireAuth`/`AuthedRequest` `server/src/authMiddleware.ts`де — `app.ts` менен `chatRoutes.ts`нин ортосундагы circular import'ту болтурбоо үчүн өзүнчө файлга бөлүнгөн. `src/api/client.ts` серверди `expo-constants`теги `hostUri`ден LAN IP'ди алып табат (телефон/веб экөө тең иштеши үчүн), порт 4000ге катуу коюлган; эгер `EXPO_PUBLIC_API_URL` build-time env коюлса, ал LAN-IP логикадан мурда артыкчылык алат (production build'дер cloud серверге ушул аркылуу көрсөтөт).
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

## Папка структурасы (иш жүзүндөгү)

```
health-app/
  App.tsx
  index.ts
  app.json
  src/
    api/             — client.ts (fetch wrapper + LAN base URL), errors.ts (ApiErrorCode → TranslationKey)
    ble/             — gatt.ts (стандарттуу BLE UUID'лар + IEEE-11073 SFLOAT парсинг, native модулго көз каранды эмес)
    sleep/           — sleepSampling.ts (background task definition + акселерометр өлчөө)
    components/     — Button, TextField, VitalCard, MeasurementIcon, ReminderIcon, ReminderListItem, ThemeModeSelector, LanguageSelector, MedicalDisclaimer, SettingsLinkRow, ClearDataSection
    context/         — MeasurementsContext, ProfileContext, RemindersContext, ReminderLogContext, SettingsContext, LocaleContext, AuthContext, EmergencyContactsContext, BleContext, StepsContext, SleepContext, ComposeProviders
    data/            — measurements.ts, profile.ts, reminders.ts, reminderLog.ts, insights.ts, emergencyContacts.ts, sos.ts, steps.ts, sleep.ts (типтер + форматтоо/эсептөө функциялары; көрсөтүлүүчү тексттер эмес — алар i18n'де)
    i18n/            — ky.ts (канондук), ru.ts, en.ts
    navigation/       — RootNavigator.tsx
    notifications/    — reminderNotifications.ts, thresholdAlerts.ts
    screens/          — Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings, SOS, EmergencyContacts, AddEmergencyContact, Chat, DoctorInbox, Bluetooth, Sleep
    theme/            — colors, typography, spacing, radii, ThemeProvider
  server/            — локалдуу Express auth+chat сервери (өз package.json'у, health-app'тин ичине кирбейт)
    Dockerfile        — cloud деплой үчүн (Render Docker environment), `npm install` + `tsx` менен иштетет
    render.yaml        — Render Blueprint (dashboard'до "New + Blueprint" ушуну автоматтык окуйт)
    src/
      index.ts        — listen(0.0.0.0:PORT)
      app.ts           — Express app + auth routes (signup/login/me)
      authMiddleware.ts — requireAuth (app.ts менен chatRoutes.ts экөө тең колдонот)
      chatRoutes.ts     — /api/chat/* (requireDoctor гейт менен)
      dataRoutes.ts      — /api/data/{measurements,profile,reminders} (GET/PUT, requireAuth менен)
      auth.ts          — JWT sign/verify, production'до JWT_SECRET жоктон fail-fast
      dataDir.ts        — JSON-файлдардын жайгашкан жерин аныктайт (`DATA_DIR` env же дефолт `data/`)
      userStore.ts      — users.json'го окуу/жазуу (role талаасы менен)
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

**"Телемедицина" жөнүндө эскертүү:** Video/аудио чалуу жок — **тек текст чат**, `ChatScreen`/`DoctorInboxScreen`/`server/src/chatStore.ts` аркылуу. Poll'доо менен (3 сек интервал) "реалдуу убакытка жакын" эффект түзүлөт, WebSocket жок. **Дарыгер каттоосу эч кандай жол менен текшерилбейт** — SignUp'та "Мен дарыгермин" деген checkbox'ту каалаган адам басып, өзүн дарыгер катары каттай алат (медициналык лицензия/диплом сурала турган логика жок). Бул MVP/dev-only контекстте гана колдонулушу керек — чыныгы колдонуучулар менен эч качан. Бир дарыгер каттоо болсо, ал БАРДЫК пациенттердин билдирүүлөрүн көрөт жана жооп бере алат (пациент конкреттүү дарыгер тандабайт, дарыгер-пациент тиешелүү бөлүштүрүү жок — бирдиктүү inbox модели).

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
3. **Коопсуздук:** AsyncStorage'дагы медициналык дайын шифрленбейт; `JWT_SECRET`дин dev-only дефолт мааниси бар (production'до дагы эле колдонулса — коркунучтуу); сырсөз калыбына келтирүү (forgot password) жок; "Мен дарыгермин" checkbox'ун эч ким текшербейт (бул production'до өзгөчө коркунучтуу — медициналык кеңеш берүү контекстинде).
4. **Ишенимдүүлүк:** Android'до (Xiaomi/Huawei ж.б. батарея-үнөмдөө агрессивдүү бренддерде) фондук эскертмелер/уйку-трекинг дагы эле тестирленген эмес (жогорудагы эскертүүлөрдү кара — "Уйку эсептегич", "Кадам эсептегич"). Автоматтык тесттер (unit/integration) такыр жок.
5. **Улгайган колдонуучуга ылайыктоо:** Чоң тамга/жогорку контраст режими, биринчи ачылууда түшүндүрүү (onboarding) жок — CLAUDE.mdдеги максаттуу аудитория ("орто жаштагы жана улгайган колдонуучулар") менен интерфейстин татаалдыгы дал келбейт.
6. **Play Store'го чыгарууга даярдык:** Купуялык саясаты (privacy policy), пайдалануу шарттары жок — "медициналык" категория Google тарабынан өзгөчө көзөмөлдөнөт, булар милдеттүү болот.

Бул тизмеге эч бир код жазылган жок — CLAUDE.mdге белгиленди, ар бир пункт Claude Code'го өзүнчө, ирети менен (1ден баштап) тапшырма катары берилиши керек.

## Эскертүү

Бул медициналык маалымат менен иштеген тиркеме — колдонуучуга көрсөтүлгөн ар бир медициналык маалымат экранында "Бул медициналык диагноз эмес" деген эскертүү болушу сунушталат.
