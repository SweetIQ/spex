////////////////////////////////////////
// Requires SPEX v1.0.7 or later.
////////////////////////////////////////

type XPromise<A> = Promise<A>;

type TOriginData = { success: boolean, result: any };
type TBatchData = { success: boolean, result: any, origin?: TOriginData };

interface IBatchStat {
    total: number;
    succeeded: number;
    failed: number;
    duration: number;
}

// API: http://vitaly-t.github.io/spex/errors.BatchError.html
interface IBatchError extends Error {

    // standard error properties:
    name: string;
    message: string;
    stack: string;

    // extended properties:
    data: Array<TBatchData>;

    stat: IBatchStat;

    first: any;

    // API: http://vitaly-t.github.io/spex/errors.BatchError.html#.getErrors
    getErrors(): Array<any>;

    // API: http://vitaly-t.github.io/spex/errors.BatchError.html#.toString
    toString(): string;

}

// API: http://vitaly-t.github.io/spex/errors.PageError.html
interface IPageError extends Error {

    // standard error properties:
    name: string;
    message: string;
    stack: string;

    // extended properties:
    error: any;
    index: number;
    duration: number;
    reason: string;
    source: any;
    dest: any;

    // API: http://vitaly-t.github.io/spex/errors.PageError.html#.toString
    toString(): string;
}

// API: http://vitaly-t.github.io/spex/errors.SequenceError.html
interface ISequenceError extends Error {

    // standard error properties:
    name: string;
    message: string;
    stack: string;

    // extended properties:
    error: any;
    index: number;
    duration: number;
    reason: string;
    source: any;
    dest: any;

    // API: http://vitaly-t.github.io/spex/errors.SequenceError.html#.toString
    toString(): string;

}

interface IErrors {
    BatchError: IBatchError;
    PageError: IPageError;
    SequenceError: ISequenceError;
}

interface IStreamRead {
    calls: number;
    reads: number;
    length: number;
    duration: number;
}

// API: http://vitaly-t.github.io/spex/stream.html
interface IStream {
    // API: http://vitaly-t.github.io/spex/stream.html#.read
    read(stream: any, receiver: (index: number, data: Array<any>, delay: number) => any, closable?: boolean, readSize?: number): XPromise<IStreamRead>;
    read(stream: any, receiver: (index: number, data: Array<any>, delay: number) => any, options?: { closable?: boolean, readSize?: number }): XPromise<IStreamRead>;
}

declare namespace spex {

    // PromiseAdapter class;
    // API: http://vitaly-t.github.io/spex/PromiseAdapter.html
    class PromiseAdapter {
        constructor(create: (cb: any) => Object, resolve: (data: any) => void, reject: (reason: any) => void);
    }

    // Subset of the base methods only, to be used by pg-promise
    interface ISpexBase {

        // API: http://vitaly-t.github.io/spex/global.html#batch
        batch(values: Array<any>, cb?: (index: number, success: boolean, result: any, delay: number) => any): XPromise<Array<any>>;
        batch(values: Array<any>, options: { cb?: (index: number, success: boolean, result: any, delay: number) => any }): XPromise<Array<any>>;

        // API: http://vitaly-t.github.io/spex/global.html#page
        page(source: (index: number, data: any, delay: number) => any, dest?: (index: number, data: any, delay: number) => any, limit?: number): XPromise<{ pages: number, total: number, duration: number }>;
        page(source: (index: number, data: any, delay: number) => any, options: { dest?: (index: number, data: any, delay: number) => any, limit?: number }): XPromise<{ pages: number, total: number, duration: number }>;

        // API: http://vitaly-t.github.io/spex/global.html#sequence
        sequence(source: (index: number, data: any, delay: number) => any, dest?: (index: number, data: any, delay: number) => any, limit?: number, track?: boolean): XPromise<any>;
        sequence(source: (index: number, data: any, delay: number) => any, options: { dest?: (index: number, data: any, delay: number) => any, limit?: number, track?: boolean }): XPromise<any>;
    }

    interface ISpex extends ISpexBase {

        // API: http://vitaly-t.github.io/spex/stream.html
        stream: IStream;

        // API: http://vitaly-t.github.io/spex/errors.html
        errors: IErrors;
    }

}

declare function spex(promise: any): spex.ISpex;

export = spex;
