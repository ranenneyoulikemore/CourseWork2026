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
}