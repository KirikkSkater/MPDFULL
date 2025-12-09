class ViewRegistry {
    static views = new Map();
    
    static register(key, ViewClass) {
        this.views.set(key, ViewClass);
    }
    
    static create(key, ...args) {
        const ViewClass = this.views.get(key);
        return ViewClass ? new ViewClass(...args) : null;
    }
    
    static has(key) {
        return this.views.has(key);
    }
}