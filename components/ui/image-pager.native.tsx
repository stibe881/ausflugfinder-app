import React from 'react';
import PagerView from 'react-native-pager-view';

interface ImagePagerProps {
    children: React.ReactNode;
    initialPage?: number;
    onPageSelected?: (e: any) => void;
    style?: any;
}

export function ImagePager({ children, initialPage = 0, onPageSelected, style }: ImagePagerProps) {
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
