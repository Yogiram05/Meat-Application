export const Colors = {
    primary: '#E31C25', // Premium Red (like raw meat/freshness)
    secondary: '#2D3436', // Dark Grey for text
    background: '#FFFFFF',
    surface: '#F5F6FA',
    text: '#2D3436',
    textLight: '#636E72',
    white: '#FFFFFF',
    success: '#00B894',
    error: '#FF7675',
    border: '#DFE6E9',
};

export const Spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
};

import { TextStyle } from 'react-native';

export const Typography: { [key: string]: TextStyle } = {
    h1: { fontSize: 32, fontWeight: '700', color: Colors.text },
    h2: { fontSize: 24, fontWeight: '700', color: Colors.text },
    h3: { fontSize: 20, fontWeight: '600', color: Colors.text },
    body: { fontSize: 16, color: Colors.text },
    caption: { fontSize: 14, color: Colors.textLight },
    button: { fontSize: 16, fontWeight: '600', color: Colors.white },
};
