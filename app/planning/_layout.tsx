import { Stack } from "expo-router";

export default function PlanningLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="create" />
            <Stack.Screen name="[id]/index" />
            <Stack.Screen name="[id]/participants" />
            <Stack.Screen name="[id]/tasks" />
            <Stack.Screen name="[id]/budget" />
            <Stack.Screen name="[id]/timeline" />
            <Stack.Screen name="[id]/transport" />
            <Stack.Screen name="[id]/bookings" />
            <Stack.Screen name="[id]/chat" />
            <Stack.Screen name="[id]/settings" />
            <Stack.Screen name="invite/[token]" />
        </Stack>
    );
}
