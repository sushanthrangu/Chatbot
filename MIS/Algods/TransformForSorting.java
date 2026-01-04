
import java.util.*;
class Record {
int id;
String name;
int age;
Record(int id, String name, int age) {
this.id = id;
this.name = name;
this.age = age;
}
@Override
public String toString() {
return id + ", " + name + ", " + age;
}
}
public class TransformForSorting {
public static List<Map.Entry<Integer, Record>> transformForSorting(List<Record>
records) {
List<Map.Entry<Integer, Record>> transformed = new ArrayList<>();
for (Record r : records) {
transformed.add(Map.entry(Integer.valueOf(r.age), r)); // key = Age
}
return transformed;
}
public static void main(String[] args) {
List<Record> records = Arrays.asList(
new Record(1034, "Alice", 23),
new Record(1012, "Bob", 34),
new Record(1089, "Carol", 27),
new Record(1005, "David", 23)
);
List<Map.Entry<Integer, Record>> transformed =
transformForSorting(records);
// Show transformed result
for (Map.Entry<Integer, Record> e : transformed) {
System.out.println("(" + e.getKey() + ", " + e.getValue() + ")");
}
}
}
