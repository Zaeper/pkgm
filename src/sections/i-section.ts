export interface ISection<T> {
    render(): T | Promise<T>
}