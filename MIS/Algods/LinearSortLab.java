

import java.util.*;
/**
* Record class representing a simple data item.
*/
// class Record {
// int id;
// String name;
// int age;
// Record(int id, String name, int age) {
// this.id = id;
// this.name = name;
// this.age = age;
// }
// @Override
// public String toString() {
// return id + ", " + name + ", " + age;
// }
// }
/**
* Main class for transformation, sorting, and timing tests.
*/
public class LinearSortLab {
// ---------- LINEAR SORT IMPLEMENTATION (Counting Sort) ----------
public static List<Map.Entry<Integer, Record>>
linearSort(List<Map.Entry<Integer, Record>> records) {
// Find max age
int max = Integer.MIN_VALUE;
int min = Integer.MAX_VALUE;
for (Map.Entry<Integer, Record> r : records) {
if (r.getKey() > max) max = r.getKey();
if (r.getKey() < min) min = r.getKey();
}
// Counting sort based on age
int[] count = new int[max - min + 1];
for (int i = min; i <= max; i++) count[i-min] = 0;
// Count occurrences
for (Map.Entry<Integer, Record> r : records) {
count[r.getKey()-min]++;
}
// Compute prefix sums
for (int i = min+1; i <= max; i++) {
count[i-min] += count[i -min - 1];
}
// Build output list (stable sort)
List<Map.Entry<Integer, Record>> output = new
ArrayList<>(Collections.nCopies(records.size(), null));
for (int i = records.size() - 1; i >= 0; i--) {
Map.Entry<Integer, Record> r = records.get(i);
output.set(count[r.getKey()-min] - 1, r);
count[r.getKey()-min]--;
System.out.println(i); // Debug print
for (int j = 0; j < count.length; j++) {
System.out.println((j+min) + " - " + count[j]);
}
}
return output;
}
// ---------- HELPER: Generate Random Records ----------
public static List<Map.Entry<Integer, Record>> generateRecords(int n) {
Random rand = new Random();
List<Map.Entry<Integer, Record>> records = new ArrayList<>();
for (int i = 0; i < n; i++) {
int id = 1000 + rand.nextInt(9000);
String name = "User" + i;
int age = rand.nextInt(20); // ages between 0–99
records.add(Map.entry(age, new Record(id, name, age)));
}
return records;
}
// ---------- MAIN TEST ----------
public static void main(String[] args) {
int[] sizes = {10000, 100000, 1000000};
//for (int n : sizes)
int n=4;
{
//List<Map.Entry<Integer, Record>> records = generateRecords(n);
List<Map.Entry<Integer, Record>> records = Arrays.asList(
Map.entry(23, new Record(1034, "Alice", 23)),
Map.entry(34, new Record(1012, "Bob", 34)),
Map.entry(27, new Record(1089, "Carol", 27)),
Map.entry(23, new Record(1005, "David", 23))
);
// Clone the list for fair comparison
List<Map.Entry<Integer, Record>> recordsForCollectionsSort = new
ArrayList<>();
for (Map.Entry<Integer, Record> r : records) {
recordsForCollectionsSort.add(Map.entry(r.getKey(), r.getValue()));
}
// --- Linear Sort ---
long start = System.currentTimeMillis();
List<Map.Entry<Integer, Record>> sortedLinear = linearSort(records);
long end = System.currentTimeMillis();
System.out.printf("Linear Sort (n=%d): %d ms%n", n, (end - start));
for (Map.Entry<Integer, Record> e : sortedLinear) {
System.out.println("(" + e.getKey() + ", " + e.getValue() + ")");
}
// --- Collections.sort() ---
start = System.currentTimeMillis();
//Collections.sort(recordsForCollectionsSort, Comparator.comparingInt(r-> r.age));
recordsForCollectionsSort.sort(Comparator.comparingInt(Map.Entry::getKey));
end = System.currentTimeMillis();
System.out.printf("Collections.sort (n=%d): %d ms%n", n, (end -
start));
System.out.println("-----------------------------");
}
}
}
