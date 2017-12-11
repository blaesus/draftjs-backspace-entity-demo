import React from 'react'

class OptionsDropdown extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            inFocus: false,
        }
    }

    matchOptions(options, search) {
        if (search === null) {
            return []
        }
        return (search.length === 0)
            ? []
            : options.filter(option => option.keywords.some(keyword => keyword.startsWith(search)))
    }

    render() {
        const {options, search} = this.props
        const relevantOptions = this.matchOptions(options, search)
        return (
            <div style={{
                ...this.props.style,
                maxHeight: '100px',
                overflowY: 'scroll',
            }}>
                {
                    relevantOptions
                        .map((option, index) =>
                            <div
                                key={option.value}
                                onClick={() => this.props.onChoose(option.value)}
                            >
                                {option.text}
                            </div>
                        )
                }
            </div>
        )
    }
}

export default OptionsDropdown
