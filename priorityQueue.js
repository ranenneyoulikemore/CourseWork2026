'use strict'
export class BiDirectionalPriorityQueue {
  constructor() {
    this.items = [];
    this.insertionCounter = 0; 
  }

  enqueue(item, priority) {
    this.items.push({
      item: item,
      priority: priority,
      order: this.insertionCounter++ 
    });
  }

  _findIndex(criteria) {
    if (this.items.length === 0) return -1;

    if (criteria === 'oldest') return 0; 
    if (criteria === 'newest') return this.items.length - 1; 

    let targetIndex = 0;
    for (let i = 1; i < this.items.length; i++) {
      if (criteria === 'highest' && this.items[i].priority > this.items[targetIndex].priority) {
        targetIndex = i;
      } else if (criteria === 'lowest' && this.items[i].priority < this.items[targetIndex].priority) {
        targetIndex = i;
      }
    }
    return targetIndex;
  }
}