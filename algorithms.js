/**
 * Page Replacement Algorithm Implementations
 */

class PageReplacementSimulator {
    constructor(pageRefString, numFrames) {
        this.pageRefString = pageRefString.split(',').map(p => parseInt(p.trim()));
        this.numFrames = numFrames;
    }

    /**
     * FIFO - First In First Out Algorithm
     */
    fifo() {
        const frames = new Array(this.numFrames).fill(-1);
        const steps = [];
        let pageFaults = 0;
        let pageIndex = 0;

        for (const page of this.pageRefString) {
            let framesCopy = [...frames];
            let isPageFault = true;

            // Check if page is already in frames
            if (frames.includes(page)) {
                isPageFault = false;
            } else {
                pageFaults++;
                // Replace the oldest page (FIFO)
                frames[pageIndex % this.numFrames] = page;
                pageIndex++;
            }

            steps.push({
                page: page,
                frames: framesCopy,
                isFault: isPageFault,
                faults: pageFaults
            });
        }

        return {
            steps: steps,
            totalFaults: pageFaults
        };
    }

    /**
     * LRU - Least Recently Used Algorithm
     */
    lru() {
        const frames = new Array(this.numFrames).fill(-1);
        const lastUsed = new Array(this.numFrames).fill(-1);
        const steps = [];
        let pageFaults = 0;
        let time = 0;

        for (const page of this.pageRefString) {
            let framesCopy = [...frames];
            let isPageFault = true;
            let pageIndex = frames.indexOf(page);

            if (pageIndex !== -1) {
                // Page is already in frames
                isPageFault = false;
                lastUsed[pageIndex] = time;
            } else {
                // Page needs to be loaded
                pageFaults++;
                let emptyFrame = frames.indexOf(-1);

                if (emptyFrame !== -1) {
                    // There's an empty frame
                    frames[emptyFrame] = page;
                    lastUsed[emptyFrame] = time;
                } else {
                    // No empty frame, replace the LRU page
                    const lruIndex = lastUsed.indexOf(Math.min(...lastUsed));
                    frames[lruIndex] = page;
                    lastUsed[lruIndex] = time;
                }
            }

            steps.push({
                page: page,
                frames: framesCopy,
                isFault: isPageFault,
                faults: pageFaults
            });

            time++;
        }

        return {
            steps: steps,
            totalFaults: pageFaults
        };
    }

    /**
     * Optimal Page Replacement - Replace page that will not be used for longest time
     */
    optimal() {
        const frames = new Array(this.numFrames).fill(-1);
        const steps = [];
        let pageFaults = 0;

        for (let i = 0; i < this.pageRefString.length; i++) {
            const page = this.pageRefString[i];
            let framesCopy = [...frames];
            let isPageFault = true;

            if (frames.includes(page)) {
                // Page is already in frames
                isPageFault = false;
            } else {
                // Page needs to be loaded
                pageFaults++;
                let emptyFrame = frames.indexOf(-1);

                if (emptyFrame !== -1) {
                    // There's an empty frame
                    frames[emptyFrame] = page;
                } else {
                    // No empty frame, replace the page that will not be used for longest time
                    const pageToReplace = this.findOptimalPage(frames, i);
                    const replaceIndex = frames.indexOf(pageToReplace);
                    frames[replaceIndex] = page;
                }
            }

            steps.push({
                page: page,
                frames: framesCopy,
                isFault: isPageFault,
                faults: pageFaults
            });
        }

        return {
            steps: steps,
            totalFaults: pageFaults
        };
    }

    /**
     * Find the page that will not be used for longest time in optimal algorithm
     */
    findOptimalPage(frames, currentIndex) {
        let farthest = -1;
        let pageToReplace = frames[0];

        for (const frame of frames) {
            let nextUse = Infinity;

            // Find next use of this page
            for (let i = currentIndex + 1; i < this.pageRefString.length; i++) {
                if (this.pageRefString[i] === frame) {
                    nextUse = i;
                    break;
                }
            }

            if (nextUse > farthest) {
                farthest = nextUse;
                pageToReplace = frame;
            }
        }

        return pageToReplace;
    }
}

// Export for use in Node or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageReplacementSimulator;
}
