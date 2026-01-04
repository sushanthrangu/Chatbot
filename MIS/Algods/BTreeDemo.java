import java.util.ArrayList;

/** Simple payload record */
// class Record {
//     int id; String name; int age;
//     Record(int id, String name, int age) { this.id=id; this.name=name; this.age=age; }
//     @Override public String toString() {
//         return "{ID:" + id + ", Name:\"" + name + "\", Age:" + age + "}";
//     }
// }

/** B-Tree for Integer keys and Record values (min-degree T) */
class BTree {
    private final int T;

    static class Node {
        boolean leaf = true;
        ArrayList<Integer> keys = new ArrayList<>();
        ArrayList<Record>  values = new ArrayList<>();
        ArrayList<Node>    children = new ArrayList<>();
        boolean isFull(int T) { return keys.size() == 2*T - 1; }
    }

    private Node root = new Node();

    public BTree(int t) {
        if (t < 2) throw new IllegalArgumentException("T must be >= 2");
        this.T = t;
    }

    public void insert(int key, Record value) {
        Node r = root;
        if (r.isFull(T)) {
            Node s = new Node();
            s.leaf = false;
            s.children.add(r);
            root = s;
            splitChild(s, 0);
            insertNonFull(s, key, value);
        } else {
            insertNonFull(r, key, value);
        }
    }

    private void insertNonFull(Node x, int key, Record value) {
        int i = x.keys.size() - 1;
        if (x.leaf) {
            // shift while strictly greater; equals go to the right (stable for duplicates)
            x.keys.add(0);     // placeholders
            x.values.add(null);
            while (i >= 0 && key < x.keys.get(i)) {
                x.keys.set(i+1, x.keys.get(i));
                x.values.set(i+1, x.values.get(i));
                i--;
            }
            x.keys.set(i+1, key);
            x.values.set(i+1, value);
        } else {
            while (i >= 0 && key < x.keys.get(i)) i--;
            i = i + 1;
            if (x.children.get(i).isFull(T)) {
                splitChild(x, i);
                if (key > x.keys.get(i)) i++;
            }
            insertNonFull(x.children.get(i), key, value);
        }
    }

    private void splitChild(Node parent, int index) {
        Node y = parent.children.get(index);
        Node z = new Node();
        z.leaf = y.leaf;

        // median is at T-1
        int medianKey = y.keys.get(T-1);
        Record medianVal = y.values.get(T-1);

        // move last (T-1) keys/values to z
        for (int j = T; j <= 2*T - 2; j++) {
            z.keys.add(y.keys.get(j));
            z.values.add(y.values.get(j));
        }
        // if internal, move last T children to z
        if (!y.leaf) {
            for (int j = T; j <= 2*T - 1; j++) {
                z.children.add(y.children.get(j));
            }
        }

        // trim y to first (T-1) keys and first T children
        while (y.keys.size() > T-1) y.keys.remove(y.keys.size()-1);
        while (y.values.size() > T-1) y.values.remove(y.values.size()-1);
        if (!y.leaf) {
            while (y.children.size() > T) y.children.remove(y.children.size()-1);
        }

        // parent inserts median and z
        parent.keys.add(index, medianKey);
        parent.values.add(index, medianVal);
        parent.children.add(index+1, z);
    }

    /** Search with node-visit count (for your question 3) */
    public static class SearchResult {
        Record value; int nodesVisited;
        SearchResult(Record v, int c){ value=v; nodesVisited=c; }
    }
    public SearchResult searchWithCount(int key) {
        Counter c = new Counter();
        Record v = searchCount(root, key, c);
        return new SearchResult(v, c.count);
    }
    private static class Counter { int count=0; }
    private Record searchCount(Node x, int key, Counter c) {
        c.count++;
        int i=0;
        while (i < x.keys.size() && key > x.keys.get(i)) i++;
        if (i < x.keys.size() && key == x.keys.get(i)) return x.values.get(i);
        if (x.leaf) return null;
        return searchCount(x.children.get(i), key, c);
    }

    // Accessors for printing answers
    public Node getRoot(){ return root; }
}

public class BTreeDemo {
    public static void main(String[] args) {
        // Build B-Tree with min degree T=2
        BTree bt = new BTree(2);

        // Insert AFTER sorting by Age (stable):
        // 23(Alice), 23(David), 27(Carol), 34(Bob)
        bt.insert(23, new Record(1034, "Alice", 23));
        bt.insert(23, new Record(1005, "David", 23));
        bt.insert(27, new Record(1089, "Carol", 27));
        bt.insert(34, new Record(1012, "Bob", 34));

        // Extract level-1 children to answer the questions
        BTree.Node root = bt.getRoot();
        if (root.leaf || root.children.size() < 2) {
            System.out.println("Unexpected shape: root is leaf or lacks two children.");
            return;
        }
        BTree.Node firstChild  = root.children.get(0);
        BTree.Node secondChild = root.children.get(1);

        // Q1: first child @ level 1 (expect single key: 23->Alice)
        String q1 = "(" + firstChild.keys.get(0) + ", " + firstChild.values.get(0) + ")";

        // Q2: second child @ level 1 (expect two keys: 27->Carol, 34->Bob)
        String q2a = "(" + secondChild.keys.get(0) + ", " + secondChild.values.get(0) + ")";
        String q2b = "(" + secondChild.keys.get(1) + ", " + secondChild.values.get(1) + ")";

        // Q3: nodes visited when searching for 27
        BTree.SearchResult sr = bt.searchWithCount(27);

        // Print EXACT answers as sentences:
        System.out.println("The key-value pair in the first child at the level 1 of the BTree is " + q1 + ".");
        System.out.println("The key-value pairs in the second child at the level 1 of the BTree are " + q2a + " and " + q2b + ".");
        System.out.println("When searching for the key 27 in the BTree, " + sr.nodesVisited + " node(s) are visited.");
    }
}
