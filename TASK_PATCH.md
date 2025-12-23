# Task Management Patch Instructions

Da die auto

mated edits fehlgeschlagen sind, hier sind die manuellen Änderungen für `app/planning/[id].tsx`:

## 1. State hinzufügen (nach Zeile 43):
```tsx
const [tasks, setTasks] = useState<PlanTask[]>([]);
```

## 2. Tasks laden in `loadPlan()` (vor `setIsLoading(false);`):
```tsx
// Load tasks
const { data: tasksData } = await supabase
  .from("plan_tasks")
  .select("*")
  .eq("plan_id", id)
  .order("created_at", { ascending: false });

if (tasksData) {
  setTasks(tasksData as PlanTask[]);
}
```

## 3. `toggleTask` Funktion hinzufügen (nach `updateStatus`):
```tsx
const toggleTask = async (taskId: string) => {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const { data, error } = await supabase
    .from("plan_tasks")
    .update({ is_completed: !task.is_completed })
    .eq("id", taskId)
    .select()
    .single();

  if (data) {
    setTasks(tasks.map((t) => (t.id === taskId ? data as PlanTask : t)));
  }
};
```

## 4. Tasks Section hinzufügen (nach Participants, vor Quick Actions):
```tsx
{/* Tasks */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <ThemedText style={styles.sectionTitle}>
      Aufgaben ({tasks.filter((t) => !t.is_completed).length}/{tasks.length})
    </ThemedText>
  </View>
  {tasks.length === 0 ? (
    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
      Noch keine Aufgaben
    </ThemedText>
  ) : (
    tasks.map((task) => (
      <TaskItem key={task.id} task={task} onToggle={toggleTask} />
    ))
  )}
</View>
```

## 5. Style hinzufügen (in StyleSheet):
```tsx
emptyText: {
  fontSize: 14,
  fontStyle: "italic",
  textAlign: "center",
  padding: Spacing.lg,
},
```

Diese Änderungen müssen manuell eingefügt werden.
