import React from 'react';
import { Platform, ScrollView, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// Dynamically import PagerView to avoid web bundling issues
let PagerView: any;
if (Platform.OS !== 'web') {
    try {
        PagerView = require('react-native-pager-view').default;
    } catch (e) {
        console.error('Failed to load react-native-pager-view', e);
        PagerView = View; // Fallback
    }
}

interface ImagePagerProps {
    children: React.ReactNode;
    initialPage?: number;
    onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
    style?: any;
}

export function ImagePager({ children, initialPage = 0, onPageSelected, style }: ImagePagerProps) {
    if (Platform.OS === 'web') {
        return (
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const contentOffset = e.nativeEvent.contentOffset;
                    const viewSize = e.nativeEvent.layoutMeasurement;
                    const pageNum = Math.round(contentOffset.x / viewSize.width);
                    onPageSelected?.({ nativeEvent: { position: pageNum } });
                }}
                style={style}
            >
                {children}
            </ScrollView>
        );
    }

    return (
        <PagerView
            style={style}
            initialPage={initialPage}
            onPageSelected={onPageSelected}
        >
            {children}
        </PagerView>
    );
}
