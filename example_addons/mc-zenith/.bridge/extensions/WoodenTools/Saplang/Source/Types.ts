export interface Entry {
    key: string;
    text: string;
    remarks: string[];
    translate: boolean;
}

export interface Term {
    keys: string[];
    text: string;
}

export interface Heading {
    depth: number;
    text: string;
}

export type Line = Entry | Heading;
