@AGENTS.md

# HealthTrack (health-app) — долбоордун контексти

Бул файл ар бир сессияда автоматтык окулат. Максаты — Claude'го долбоордун учурдагы абалын, тандалган стекти жана эрежелерди кайра түшүндүрбөй эле берүү.

## Долбоор жөнүндө

Аты: HealthTrack (папка аты: `health-app`)
Түрү: Ден-соолук көрсөткүчтөрүн (кан басым, пульс, SpO2) кол менен киргизип, тарыхын көзөмөлдөгөн жана дары/эскертме коюлган мобилдик тиркеме.
Тил: UI кыргызча/орусча/англисче — `src/i18n/` жана `LocaleContext` аркылуу (тандалган тил `health-app/locale` ачкычы менен `AsyncStorage`до сакталат, демейки — `ky`).
Максаттуу колдонуучу: Кыргызстан/Орусиядагы орто жаштагы жана улгайган колдонуучулар.

**Учурдагы фаза: локалдуу MVP + локалдуу auth сервер.** Чыныгы email/сырсөз аутентификациясы бар (`server/`), бирок ал **тек локалдуу иштеши үчүн жасалган** — LAN'да devs машинасында иштейт, cloud'го deploy кылынган эмес. Профиль/өлчөө/эскертме дайындары дагы деле `AsyncStorage` аркылуу түзмөктө сакталат (сервер аккаунт менен email/sырсөз hash'ин гана сактайт, башка эч нерсени эмес).

## Тех стек (иш жүзүндө колдонулуп жаткан)

- **Mobile:** Expo SDK ~54 (2026-07-25'тен баштап; мурун 57 эле, физикалык түзмөктөгү Expo Go'нун SDK 54'кө чейин гана колдогонуна байланыштуу түшүрүлдү), React Native 0.81, React 19.1, TypeScript
- **Навигация:** `@react-navigation/native` + `native-stack` (v7) — бир гана `RootNavigator` (`src/navigation/RootNavigator.tsx`), stack ичинде экрандар: Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings. Баштапкы route `AuthContext`/`ProfileContext`нин `loading` бүткөндөн кийин эсептелет: `!user` → Login, `!profile` → ProfileSetup, экинчиси → Dashboard.
- **State/сактоо:** React Context (`createContext`/`useContext`) ар бир домен үчүн өзүнчө provider, дайыма `@react-native-async-storage/async-storage` менен персистенттелет:
  - `MeasurementsContext` → `health-app/measurements`
  - `ProfileContext` → `health-app/profile`
  - `RemindersContext` → `health-app/reminders`
  - `SettingsContext` → `health-app/settings`
  - `LocaleContext` → `health-app/locale`
  - `AuthContext` → `health-app/authToken` (JWT гана сакталат; `user` объектиси серверден `/api/auth/me` менен алынат)
  - **Zustand, Redux, Prisma, PostgreSQL — колдонулбайт.** (Мурунку талкууда сунушталган, бирок иш жүзүндө башка жол тандалган.)
- **Backend/auth:** `server/` — Express + TypeScript, `tsx` менен иштейт (`npm run dev` — `server/`дин ичинде). Колдонуучулар `server/data/users.json` файлында сакталат (JSON, native DB эмес — `better-sqlite3` бул машинада Visual Studio Build Tools жоктугунан compile болбойт, ошондуктан колдонулбайт). Пароль `bcryptjs` менен hash'делет, сессия `jsonwebtoken` (`JWT_SECRET` env, дефолт — dev-only туруктуу сыр сөз). Эндпоинттер: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` (`Authorization: Bearer <token>`). `src/api/client.ts` серверди `expo-constants`теги `hostUri`ден LAN IP'ди алып табат (телефон/веб экөө тең иштеши үчүн), порт 4000ге катуу коюлган.
- **i18n:** `src/i18n/{ky,ru,en}.ts` — тегиз (dot-namespaced) ачкычтуу сөздүктөр, `ky.ts` канондук (`TranslationKey` ушундан чыгарылат, `ru`/`en` `Record<TranslationKey, string>` менен толуктугу текшерилет). `LocaleContext`деги `t(key, params?)` `{param}` интерполяциясын колдойт. Тил тандагычта ар бир тил өз энчилүү атында көрсөтүлөт (`localeNativeName`), учурдагы тилге которулбайт.
- **Иконкалар:** `@tabler/icons-react-native`
- **Билдирмелер (reminders):** `expo-notifications`, логика `src/notifications/reminderNotifications.ts` ичинде
- **Дизайн токендер:** `src/theme/` — `colors.ts` (light/dark), `typography.ts`, `spacing.ts`, `radii.ts`, баары `ThemeProvider.tsx` аркылуу `useTheme()` менен колдонулат

⚠️ **Маанилуу:** `AGENTS.md`де айтылгандай, долбоор SDK 54'кө түшүрүлгөн (Expo Go'нун телефондогу колдоо чегине жараша). Код жазаардын алдында так версияланган документти текшер: https://docs.expo.dev/versions/v54.0.0/

## Иштетүү (локалдуу дев)

Эки процесс өзүнчө иштетилиши керек:
1. **Auth сервер:** `server/` папкасынын ичинде `npm install` (биринчи жолу), андан кийин `npm run dev` — `http://0.0.0.0:4000`де угат.
2. **Mobile app:** `health-app/` тамырында `npx expo start` (же `--web`) — Metro'нун LAN IP'син `src/api/client.ts` автоматтык алат (`expo-constants`теги `hostUri` аркылуу), сервердин портун (4000) гана өзгөрүшсүз колдонот. Телефон/эмулятор компьютер менен бир Wi-Fi'де болушу керек, антпесе `auth.networkError` көрүнөт.

## Папка структурасы (иш жүзүндөгү)

```
health-app/
  App.tsx
  index.ts
  app.json
  src/
    api/             — client.ts (fetch wrapper + LAN base URL), errors.ts (ApiErrorCode → TranslationKey)
    components/     — Button, TextField, VitalCard, MeasurementIcon, ReminderIcon, ReminderListItem, ThemeModeSelector, LanguageSelector, MedicalDisclaimer
    context/         — MeasurementsContext, ProfileContext, RemindersContext, SettingsContext, LocaleContext, AuthContext
    data/            — measurements.ts, profile.ts, reminders.ts, insights.ts (типтер + форматтоо/эсептөө функциялары; көрсөтүлүүчү тексттер эмес — алар i18n'де)
    i18n/            — ky.ts (канондук), ru.ts, en.ts
    navigation/       — RootNavigator.tsx
    notifications/    — reminderNotifications.ts
    screens/          — Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings
    theme/            — colors, typography, spacing, radii, ThemeProvider
  server/            — локалдуу Express auth сервери (өз package.json'у, health-app'тин ичине кирбейт)
    src/
      index.ts        — listen(0.0.0.0:4000)
      app.ts           — Express routes (signup/login/me)
      auth.ts          — JWT sign/verify
      userStore.ts      — data/users.json'го окуу/жазуу
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

Азырынча кошулбайт: Bluetooth интеграция, телемедицина, SOS/үй-бүлөлүк көзөмөл. Булар — кийинки фазалар. (i18n (ru/en) жана backend/auth сервер ишке ашырылды — жогорудагы тиешелүү бөлүмдөрдү кара. Backend азырынча **тек локалдуу** — cloud'го deploy кылынган эмес, production'го чыгаруу өзүнчө чоң чечим.)

**"AI-анализ" жөнүндө эскертүү:** `InsightsScreen` (`quickLink.insights` → "Талдоо") жана `src/data/insights.ts` чыныгы AI/ML эмес — сакталган өлчөөлөрдү стандарттык медициналык диапазондорго салыштырган локалдуу эвристика (`computeInsights`: `good`/`watch`/`concern` статусу + мурунку жазуу менен салыштырылган тренд). Тармакка чыгуу, LLM чакыруу жок. UI тексттеринде "AI" деп аталбайт — колдонуучуну алдабоо үчүн.

## Эскертүү

Бул медициналык маалымат менен иштеген тиркеме — колдонуучуга көрсөтүлгөн ар бир медициналык маалымат экранында "Бул медициналык диагноз эмес" деген эскертүү болушу сунушталат.
