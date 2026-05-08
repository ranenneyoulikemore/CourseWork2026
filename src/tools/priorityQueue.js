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

    _findTargetIndex(type){
        if (this.items.length === 0) return -1;
        let targetIndx = 0;
        for ( let i = 1; i < this.items.length; i++){
            const current = this.items[i];
            const target = this.items[targetIndx];

        switch(type) {
            case 'highest':
                if (current.priority > target.priority) targetIndx = i;
                break;
            case 'lowest':
                if (current.priority < target.priority) targetIndx = i;
                break;
            case 'oldest':
                if (current.order < target.order) targetIndx = i;
                 break;
            case 'newest':
                if (current.order > target.order) targetIndx = i;
                break;
        }

        }
        return targetIndx;
    }
    peek(type){
        if (this.items.length === 0) return null;
        const index = this._findTargetIndex(type);
        return this.items[index].item;
        
    }

    dequeue(type) {
        if (this.items.length === 0) return null;
            const index = this._findTargetIndex(type);
            const removed = this.items.splice(index, 1)[0];
            return removed.item;
    }
}

