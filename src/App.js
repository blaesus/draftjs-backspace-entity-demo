import React, { Component } from 'react'
import './App.css'
import {Editor, EditorState, CompositeDecorator, SelectionState, Modifier} from 'draft-js'
import OptionsDropdown from './OptionsDropdown'

function findLinkRangeFromCaret(editorState) {
    const selection = editorState.getSelection()
    if (!selection.isCollapsed()) {
        return null
    }
    const contentState = editorState.getCurrentContent()
    const focusKey = selection.getFocusKey()
    const focusOffset = selection.getFocusOffset()
    const block = contentState.getBlockForKey(focusKey)
    const text = block.getText()
    const anchorOffset = searchClosestPrefixBeforePosition(text, focusOffset, '#')
    if (anchorOffset === null) {
        return null
    }
    return new SelectionState({
        anchorKey: focusKey,
        anchorOffset: anchorOffset,
        focusKey: focusKey,
        focusOffset: focusOffset,
    })
}

function searchClosestPrefixBeforePosition(text, pos, prefix) {
    for (let inputStart = pos - 1; inputStart >= 0; inputStart -= 1) {
        const character = text[inputStart]
        if (character === prefix) {
            return inputStart
        }
        if (character === ' ') {
            return null
        }
    }
    return null
}

function replaceWithEntity(
    editorState,
    type,
    data,
    linkText,
    selection,
) {
    const contentState = editorState.getCurrentContent()
    const focusKey = selection.getFocusKey()

    /**
     * Create entity
     */
    const contentStateWithEntity = contentState.createEntity(
        type,
        'IMMUTABLE',
        data,
    )
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()

    /**
     * Replace text with entity
     */
    const contentStateWithFullText = Modifier.replaceText(
        contentStateWithEntity,
        selection,
        linkText,
        undefined,
        entityKey,
    )

    let newEditorState = EditorState.set(
        editorState,
        {currentContent: contentStateWithFullText},
    )

    return newEditorState
}

const entityFinder = (type) => function(
    contentBlock,
    callback,
    contentState,
) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity()
            return (
                entityKey !== null &&
                contentState.getEntity(entityKey).getType() === type
            )
        },
        callback,
    )
}

const Tag = (props) => {
    const data = props.contentState.getEntity(props.entityKey).getData()
    return (
        <a href={`${window.location.origin}/${data.tagId}`}>
            {data.title}
        </a>
    )
}

const Mention = (props) => {
    const data = props.contentState.getEntity(props.entityKey).getData()
    return (
        <a
            href={`${window.location.origin}/${data.userId}`}
            style={{
                background: '#eee',
                color: 'black',
                padding: '2px 6px',
                borderRadius: '8px',
            }}
        >
            <span>{data.displayName}</span>
        </a>
    )
}
const Link = (props) => {
    const data = props.contentState.getEntity(props.entityKey).getData()
    if (data.url.startsWith(window.location.origin)) {
        return (
            <a href={data.url}>
                {data.url}
            </a>
        )
    }
    else {
        return (
            <a href={data.url} target="_blank">
                {data.url}
            </a>
        )
    }
}

export const decorator = new CompositeDecorator([
    {
        strategy: entityFinder('LINK'),
        component: Link,
    },
    {
        strategy: entityFinder('MENTION'),
        component: Mention,
    },
    {
        strategy: entityFinder('TAG'),
        component: Tag,
    },
])

const tags = {
    'aaa': {
        id: 'aaa',
        type: 'private',
        title: 'tag_aaa'
    }
}

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            editorState: EditorState.createEmpty(decorator),
            search: ''
        }
    }
  render() {
    return (
        <div
            className="App"
            style={{
                position: 'relative'
            }}
        >
            <div
                style={{
                    border: '1px solid black',
                    minHeight: '200px',
                }}
                 onClick={() => this.editor.focus()}
            >
                <Editor
                    editorState={this.state.editorState}
                    onChange={editorState => {
                        const contentState = editorState.getCurrentContent()
                        const selection = editorState.getSelection()
                        const focusKey = selection.getFocusKey()
                        const focusOffset = selection.getAnchorOffset()
                        const activeBlock = contentState.getBlockForKey(focusKey)
                        const start = searchClosestPrefixBeforePosition(
                            activeBlock.getText(),
                            focusOffset,
                            '#',
                        )
                        if (start !== null) {
                            const search = activeBlock.getText().slice(start + 1, focusOffset)
                            this.setState({search})
                        }
                        this.setState({editorState})
                    }}
                    autoFocus={true}
                    ref={ref => this.editor = ref}
                />
            </div>
            <OptionsDropdown
                search={this.state.search}
                options={[
                    {
                        value: 'aaa',
                        text: 'aaa',
                        keywords: [
                            'aaa'
                        ],
                    }
                ]}
                onChoose={(value) => {
                    const linkRange = findLinkRangeFromCaret(this.state.editorState)
                    if (linkRange) {
                        const tag = tags[value]
                        const nextState = replaceWithEntity(
                            this.state.editorState,
                            'TAG',
                            {
                                entity: 'TAG',
                                tagId: tag.id,
                                title: tag.title,
                                tagType: tag.type,
                            },
                            '#' + tag.title,
                            linkRange,
                        )
                        if (nextState) {
                            this.setState({
                                editorState: nextState,
                            })
                        }
                    }
                    console.info(value)
                }}
            />
        </div>
    );
  }
}

export default App;
