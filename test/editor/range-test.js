/*
Copyright 2019 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import expect from 'expect';
import EditorModel from "../../src/editor/model";
import {createPartCreator} from "./mock";

function createRenderer() {
    const render = (c) => {
        render.caret = c;
        render.count += 1;
    };
    render.count = 0;
    render.caret = null;
    return render;
}

const pillChannel = "#riot-dev:matrix.org";

describe('editor/range', function() {
    it('range on empty model', function() {
        const renderer = createRenderer();
        const pc = createPartCreator();
        const model = new EditorModel([], pc, renderer);
        const range = model.startRange(model.positionForOffset(0, true));  // after "world"
        let called = false;
        range.expandBackwardsWhile(chr => {
            called = true;
            return true;
        });
        expect(called).toBe(false);
        expect(range.text).toBe("");
    });
    it('range replace within a part', function() {
        const renderer = createRenderer();
        const pc = createPartCreator();
        const model = new EditorModel([pc.plain("hello world!!!!")], pc, renderer);
        const range = model.startRange(model.positionForOffset(11));  // after "world"
        range.expandBackwardsWhile((index, offset) => model.parts[index].text[offset] !== " ");
        expect(range.text).toBe("world");
        range.replace([pc.roomPill(pillChannel)]);
        console.log({parts: JSON.stringify(model.serializeParts())});
        expect(model.parts[0].type).toBe("plain");
        expect(model.parts[0].text).toBe("hello ");
        expect(model.parts[1].type).toBe("room-pill");
        expect(model.parts[1].text).toBe(pillChannel);
        expect(model.parts[2].type).toBe("plain");
        expect(model.parts[2].text).toBe("!!!!");
        expect(model.parts.length).toBe(3);
        expect(renderer.count).toBe(1);
    });
    it('range replace across parts', function() {
        const renderer = createRenderer();
        const pc = createPartCreator();
        const model = new EditorModel([
            pc.plain("try to re"),
            pc.plain("pla"),
            pc.plain("ce "),
            pc.plain("me"),
        ], pc, renderer);
        const range = model.startRange(model.positionForOffset(14));  // after "replace"
        range.expandBackwardsWhile((index, offset) => model.parts[index].text[offset] !== " ");
        expect(range.text).toBe("replace");
        console.log("range.text", {text: range.text});
        range.replace([pc.roomPill(pillChannel)]);
        expect(model.parts[0].type).toBe("plain");
        expect(model.parts[0].text).toBe("try to ");
        expect(model.parts[1].type).toBe("room-pill");
        expect(model.parts[1].text).toBe(pillChannel);
        expect(model.parts[2].type).toBe("plain");
        expect(model.parts[2].text).toBe(" me");
        expect(model.parts.length).toBe(3);
        expect(renderer.count).toBe(1);
    });
});