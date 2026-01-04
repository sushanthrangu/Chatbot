#include <iostream>
using namespace std;


void selection_sort(int arr[],int n){
    for(int i=0;i<n-1;i++){
        int min;
        min = i;
        for(int j=1;j<n;j++){
            if(arr[j]<arr[min]){
                min=j;
            }
        }
       swap(arr[i],arr[min]);

    }
    for(int i =0;i<n;i++){
    cout<<arr[i]<<" ";
    }

}
int main(){
    int n;
  int arr[] = {5,3,9,1,2};
  n= sizeof(arr)/sizeof(arr[0]);
  selection_sort(arr,n);
  return 0;
}