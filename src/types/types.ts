export type Tag = string;

export interface PinData {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    tags: Tag[];
}