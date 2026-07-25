@AGENTS.md

# HealthTrack (health-app) — долбоордун контексти

Бул файл ар бир сессияда автоматтык окулат. Максаты — Claude'го долбоордун учурдагы абалын, тандалган стекти жана эрежелерди кайра түшүндүрбөй эле берүү.

## Долбоор жөнүндө

Аты: HealthTrack (папка аты: `health-app`)
Түрү: Ден-соолук көрсөткүчтөрүн (кан басым, пульс, SpO2) кол менен киргизип, тарыхын көзөмөлдөгөн жана дары/эскертме коюлган мобилдик тиркеме.
Тил: UI кыргызча/орусча/англисче — `src/i18n/` жана `LocaleContext` аркылуу (тандалган тил `health-app/locale` ачкычы менен `AsyncStorage`до сакталат, демейки — `ky`).
Максаттуу колдонуучу: Кыргызстан/Орусиядагы орто жаштагы жана улгайган колдонуучулар.

**Учурдагы фаза: локалдуу MVP.** Backend, аутентификация, серверде сактоо — жок. Login/SignUp экрандары интерфейс катары гана бар, чыныгы аккаунт текшерүү/сервер жок. Бардык маалымат түзмөктө `AsyncStorage` аркылуу сакталат.

## Тех стек (иш жүзүндө колдонулуп жаткан)

- **Mobile:** Expo SDK ~54 (2026-07-25'тен баштап; мурун 57 эле, физикалык түзмөктөгү Expo Go'нун SDK 54'кө чейин гана колдогонуна байланыштуу түшүрүлдү), React Native 0.81, React 19.1, TypeScript
- **Навигация:** `@react-navigation/native` + `native-stack` (v7) — бир гана `RootNavigator` (`src/navigation/RootNavigator.tsx`), stack ичинде экрандар: Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Reminders, AddReminder, Settings
- **State/сактоо:** React Context (`createContext`/`useContext`) ар бир домен үчүн өзүнчө provider, дайыма `@react-native-async-storage/async-storage` менен персистенттелет:
  - `MeasurementsContext` → `health-app/measurements`
  - `ProfileContext` → `health-app/profile`
  - `RemindersContext` → `health-app/reminders`
  - `SettingsContext` → `health-app/settings`
  - `LocaleContext` → `health-app/locale`
  - **Zustand, Redux, Prisma, PostgreSQL — колдонулбайт.** (Мурунку талкууда сунушталган, бирок иш жүзүндө башка жол тандалган.)
- **i18n:** `src/i18n/{ky,ru,en}.ts` — тегиз (dot-namespaced) ачкычтуу сөздүктөр, `ky.ts` канондук (`TranslationKey` ушундан чыгарылат, `ru`/`en` `Record<TranslationKey, string>` менен толуктугу текшерилет). `LocaleContext`деги `t(key, params?)` `{param}` интерполяциясын колдойт. Тил тандагычта ар бир тил өз энчилүү атында көрсөтүлөт (`localeNativeName`), учурдагы тилге которулбайт.
- **Иконкалар:** `@tabler/icons-react-native`
- **Билдирмелер (reminders):** `expo-notifications`, логика `src/notifications/reminderNotifications.ts` ичинде
- **Дизайн токендер:** `src/theme/` — `colors.ts` (light/dark), `typography.ts`, `spacing.ts`, `radii.ts`, баары `ThemeProvider.tsx` аркылуу `useTheme()` менен колдонулат
- **Backend жок** — API, Express, auth сервер, база азырынча долбоордо жок

⚠️ **Маанилуу:** `AGENTS.md`де айтылгандай, долбоор SDK 54'кө түшүрүлгөн (Expo Go'нун телефондогу колдоо чегине жараша). Код жазаардын алдында так версияланган документти текшер: https://docs.expo.dev/versions/v54.0.0/

## Папка структурасы (иш жүзүндөгү)

```
health-app/
  App.tsx
  index.ts
  app.json
  src/
    components/     — Button, TextField, VitalCard, MeasurementIcon, ReminderIcon, ReminderListItem, ThemeModeSelector, LanguageSelector, MedicalDisclaimer
    context/         — MeasurementsContext, ProfileContext, RemindersContext, SettingsContext, LocaleContext
    data/            — measurements.ts, profile.ts, reminders.ts, insights.ts (типтер + форматтоо/эсептөө функциялары; көрсөтүлүүчү тексттер эмес — алар i18n'де)
    i18n/            — ky.ts (канондук), ru.ts, en.ts
    navigation/       — RootNavigator.tsx
    notifications/    — reminderNotifications.ts
    screens/          — Login, SignUp, ProfileSetup, Dashboard, AddMeasurement, History, Insights, Reminders, AddReminder, Settings
    theme/            — colors, typography, spacing, radii, ThemeProvider
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

Азырынча кошулбайт: Bluetooth интеграция, телемедицина, backend/auth сервер, SOS/үй-бүлөлүк көзөмөл. Булар — кийинки фазалар. (i18n (ru/en) ишке ашырылды — жогорудагы "i18n" бөлүмүн кара.)

**"AI-анализ" жөнүндө эскертүү:** `InsightsScreen` (`quickLink.insights` → "Талдоо") жана `src/data/insights.ts` чыныгы AI/ML эмес — сакталган өлчөөлөрдү стандарттык медициналык диапазондорго салыштырган локалдуу эвристика (`computeInsights`: `good`/`watch`/`concern` статусу + мурунку жазуу менен салыштырылган тренд). Тармакка чыгуу, LLM чакыруу жок. UI тексттеринде "AI" деп аталбайт — колдонуучуну алдабоо үчүн.

## Эскертүү

Бул медициналык маалымат менен иштеген тиркеме — колдонуучуга көрсөтүлгөн ар бир медициналык маалымат экранында "Бул медициналык диагноз эмес" деген эскертүү болушу сунушталат.
