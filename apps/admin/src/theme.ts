import {
  createTheme,
  localStorageColorSchemeManager,
  type CSSVariablesResolver,
  type MantineColorsTuple,
} from "@mantine/core";

/** Titan Cockpit palette — hex lives only in this adapter file. */
const amber: MantineColorsTuple = [
  "#fff4e5",
  "#ffe4c2",
  "#ffdcc2",
  "#ffb77c",
  "#ff9f45",
  "#ff8e04",
  "#d67603",
  "#6d3900",
  "#4d2700",
  "#2e1500",
];

const pulse: MantineColorsTuple = [
  "#e5f6ff",
  "#c7e7ff",
  "#86cfff",
  "#4fc0fe",
  "#00b6fe",
  "#0099d6",
  "#0077a8",
  "#004c6d",
  "#00344c",
  "#001e2e",
];

export const colorSchemeManager = localStorageColorSchemeManager({
  key: "amphitheatre.admin.color-scheme",
});

export const theme = createTheme({
  primaryColor: "amber",
  defaultRadius: "md",
  autoContrast: true,
  fontFamily: "Raleway, system-ui, sans-serif",
  fontFamilyMonospace: "Quicksand, ui-monospace, monospace",
  headings: {
    fontFamily: "Hanken Grotesk, system-ui, sans-serif",
    fontWeight: "700",
  },
  colors: {
    amber,
    pulse,
  },
  radius: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.5rem",
    lg: "1rem",
    xl: "1.5rem",
  },
  other: {
    surfaceDark: "#1b110a",
    surfaceDarkRaised: "#281d15",
    surfaceDarkSunken: "#150c06",
    onSurfaceDark: "#f3dfd1",
    onSurfaceVariantDark: "#ddc1ae",
    outlineDark: "#a48c7a",
    outlineVariantDark: "#564334",
    surfaceLight: "#f6ebe3",
    surfaceLightRaised: "#fff8f3",
    surfaceLightSunken: "#ead9cc",
    onSurfaceLight: "#3a2e25",
    onSurfaceVariantLight: "#564334",
    outlineLight: "#847469",
    primaryAction: "#ff8e04",
    tertiaryAction: "#00b6fe",
  },
});

export const cssVariablesResolver: CSSVariablesResolver = (mantineTheme) => ({
  variables: {
    "--admin-sidebar-width": "280px",
    "--admin-header-height": "60px",
    "--admin-primary-action": mantineTheme.other.primaryAction as string,
    "--admin-tertiary-action": mantineTheme.other.tertiaryAction as string,
  },
  dark: {
    "--mantine-color-body": mantineTheme.other.surfaceDark as string,
    "--mantine-color-text": mantineTheme.other.onSurfaceDark as string,
    "--admin-surface-raised": mantineTheme.other.surfaceDarkRaised as string,
    "--admin-surface-sunken": mantineTheme.other.surfaceDarkSunken as string,
    "--admin-on-variant": mantineTheme.other.onSurfaceVariantDark as string,
    "--admin-outline": mantineTheme.other.outlineDark as string,
    "--admin-outline-variant": mantineTheme.other.outlineVariantDark as string,
    "--chart-text-color": mantineTheme.other.onSurfaceVariantDark as string,
    "--chart-grid-color": mantineTheme.other.outlineVariantDark as string,
  },
  light: {
    "--mantine-color-body": mantineTheme.other.surfaceLight as string,
    "--mantine-color-text": mantineTheme.other.onSurfaceLight as string,
    "--admin-surface-raised": mantineTheme.other.surfaceLightRaised as string,
    "--admin-surface-sunken": mantineTheme.other.surfaceLightSunken as string,
    "--admin-on-variant": mantineTheme.other.onSurfaceVariantLight as string,
    "--admin-outline": mantineTheme.other.outlineLight as string,
    "--admin-outline-variant": mantineTheme.other.surfaceLightSunken as string,
    "--chart-text-color": mantineTheme.other.onSurfaceVariantLight as string,
    "--chart-grid-color": mantineTheme.other.surfaceLightSunken as string,
  },
});
