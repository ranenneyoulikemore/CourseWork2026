"use strict";

class PriorityQueue {
    constructor() {
        this.items = [];
        this.insertOrder = 0;
    }

    enqueue(item, priority) {
        this.items.push({
            item: item,
            priority: priority,
            order: this.insertOrder++
        });
    }
}