# Mobile skeletons and motion system

## Reusable components

- `components/Skeletons.tsx` provides `SkeletonBlock` for fixed-size placeholders and `SkeletonPulse` for a group-level pulse. Each skeleton section uses one animated opacity value instead of creating an animation per row.
- Screen-specific layouts are available for the Home dashboard, weekly schedule/workout cards, evolution charts, workout details, profile team, notifications, chat messages, assessment events, app bootstrap and workout-session hydration.
- Skeletons keep the approximate shape and dimensions of the content they replace to reduce layout shifts.

## Loading and cache behavior

- Dashboard skeletons are shown only while `StudentDataContext.isLoading` is true and the corresponding section has no cached data.
- A normal refresh sets `isRefreshing`, not `isLoading`. Existing cards remain visible while the small refresh indicator runs; the screen does not flash back to skeletons.
- Independent requests (assessment calendar and chat messages) use local loading states and their own skeletons.
- Video loading uses a lightweight placeholder over the fixed 16:9 player area.

## Motion patterns

- `AppScreen` uses Expo Router `useFocusEffect` to replay a short fade/vertical entrance when a route or tab receives focus.
- The root native stack uses a short fade by default; existing detail and workout-execution stack transitions keep their specific slide directions.
- Tab icons use a subtle spring scale and active indicator. `MotionPressable` adds a small scale response to important buttons/cards, while `EnteringView` staggers list items on first mount.
- `WorkoutLoadingCard` uses UI-thread animation. Existing workout execution controls, rest/cardio timers, video playback and scroll gestures are not wrapped in the new press animation system. The execution screen only receives a skeleton while its saved session is hydrating.

## Accessibility and performance

- Reanimated animations use `ReduceMotion.System`; skeleton pulse is static when the OS requests reduced motion.
- Continuous pulse is shared once per skeleton group. Screen/card entrances and press feedback are short, and list entrance delays are capped.
- No animation dependency was added; the project already includes Reanimated 4.7.1 and React Native Worklets compatible with Expo SDK 58.

## Validation

- `npm run typecheck`: passed.
- `npx expo lint`: passed.
- `npx expo export --platform android`: passed; generated the Android Hermes JavaScript bundle. This export is not an APK/AAB build.
