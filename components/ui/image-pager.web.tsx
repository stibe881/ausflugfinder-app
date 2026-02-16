import React, { useRef, useState } from 'react';
import { ScrollView, View, NativeSyntheticEvent, NativeScrollEvent, StyleSheet, Dimensions } from 'react-native';

interface ImagePagerProps {
    children: React.ReactNode;
    initialPage?: number;
    onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
    style?: any;
}

export function ImagePager({ children, initialPage = 0, onPageSelected, style }: ImagePagerProps) {
    const scrollViewRef = useRef<ScrollView>(null);
    const [width, setWidth] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffset = event.nativeEvent.contentOffset;
        const viewSize = event.nativeEvent.layoutMeasurement;
        const pageNum = Math.round(contentOffset.x / viewSize.width);

        // We only fire if we have a valid width
        if (viewSize.width > 0 && onPageSelected) {
            // Debounce or check if changed could be added here, 
            // but parent usually handles state updates.
            onPageSelected({ nativeEvent: { position: pageNum } });
        }
    };

    return (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            scrollEventThrottle={16}
            style={style}
            onLayout={(e) => {
                setWidth(e.nativeEvent.layout.width);
            }}
        >
            {React.Children.map(children, (child, index) => (
                <View style={{ width: width || '100%', height: '100%' }}>
                    {child}
                </View>
            ))}
        </ScrollView>
    );
}
