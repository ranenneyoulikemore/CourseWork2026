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

    peek(type){
        if (this.items.length === 0) return null;

        let targetIndx = 0;
        for ( let i = 1; i < this.items.length; i++){
            if (type === 'highest' && this.items[i].priority > this.items[targetIndx].priority) targetIndx = i;
            if (type === 'lowest' && this.items[i].priority < this.items[targetIndx].priority) targetIndx = i;
            if (type === 'oldest' && this.items[i].order < this.items[targetIndx].order) targetIndx = i;
            if (type === 'newest' && this.items[i].order > this.items[targetIndx].order) targetIndx = i;
        }
        return this.items[targetIndx].item;
    
    }

    dequeue(type) {
        if (this.items.length === 0) return null;

        let targetIndx = 0;
        for (let i = 1; i < this.items.length; i++){
            if (type === 'highest' && this.items[i].priority > this.items[targetIndx].priority) targetIndx = i;
            if (type === 'lowest' && this.items[i].priority < this.items[targetIndx].priority) targetIndx = i;
            if (type === 'oldest' && this.items[i].order < this.items[targetIndx].order) targetIndx = i;
            if (type === 'newest' && this.items[i].order > this.items[targetIndx].order) targetIndx = i;
        }
        const removed = this.items.splice(targetIndx, 1) [0];
        return removed.item;
    }
}

