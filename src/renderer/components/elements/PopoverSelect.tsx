import * as React from "react"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  IThemedProperties,
  mergeClasses,
  mergeStyles,
  NestedStyles,
  PositionAbsolute,
  PositionRelative,
  rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {getValue, guard, isDefined, isFunction, isNumber, isString} from "typeguard"
import Popper from "@material-ui/core/Popper/Popper"
import Grow from "@material-ui/core/Grow/Grow"
import MenuItem from "@material-ui/core/MenuItem/MenuItem"
import ClickAwayListener from "@material-ui/core/ClickAwayListener/ClickAwayListener"


import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCommandManager} from "renderer/command-manager-ui"


const log = getLogger(__filename)

const Highlighter = require("react-highlight-words")


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {
      palette,
      components: {
        Select,
        Input,
        Typography
      }
    } = theme,
    {primary, secondary} = palette

  return {
    root: [],
    paper: [Select.paper, PositionRelative,{
      "&::after": [theme.focus, PositionAbsolute, Fill, {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        content: "' '",
        pointerEvents: "none"
      }]
    }],
    option: [Select.option.root, {
      "&.focused": [Select.option.focused,theme.outline,{

      }],
      "&.selected": [Select.option.selected,{
        "&.selected":[Select.option.selected]
      }],
      "&:hover": [Select.option.selected,{

      }]
    }],
    divider: [Select.divider],
    input: [Input.field, {
      background: Select.colors.filterBg,
      color: Select.colors.text,

      "&::placeholder": [{
        fontSize: rem(1)
      }]
    }],
    highlight: [Typography.highlight]
  }
}

type PropGetter<T> = ((option: T | null) => string | number) | keyof T

interface P<T = any> extends IThemedProperties {
  filterable?: boolean
  filterPlaceholder ?: string | null
  anchorEl: null | HTMLElement | ((element: HTMLElement) => HTMLElement)
  open: boolean
  id: string
  options: Array<T>
  selectedOption?: Array<T> | T | null
  valueGetter?: PropGetter<T>
  labelGetter?: PropGetter<T>
  styleGetter?: ((option: T | null, selected:boolean) => NestedStyles)
  noneLabel: string | JSX.Element
  unselectLabel?: string | JSX.Element
  onSelected: (option: T | null) => void
  onClose: () => void
}




export default StyledComponent<P>(baseStyles)(function PopoverSelect<T>(props: P<T>): React.ReactElement<P> {
  const
    {
      innerRef,
      options,
      id,
      filterable = true,
      filterPlaceholder = null,
      open,
      selectedOption,
      anchorEl,
      valueGetter,
      labelGetter,
      styleGetter,
      noneLabel,
      unselectLabel,
      onSelected,
      classes,
      onClose,
      ...other
    } = props




  function makeOnSelected(opt: T | null): () => void {
    return () => guard(() => onSelected(opt))
  }


  function getSingleProperty(opt: T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue: string | number = ""): string | number | null {
    return getValue(() =>
        isString(propGetter) ? opt[propGetter as string] :
          isFunction(propGetter) ? propGetter(opt) : null,
      opt ? opt[defaultProp] : defaultValue)
  }


  function getProperty(opt: T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue?: string | number): string | number | null
  function getProperty(opt: Array<T> | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue?: string | number): Array<string | number>
  function getProperty(opt: Array<T> | T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue: string | number = ""): Array<string | number> | string | number | null {
    if (Array.isArray(opt)) {
      return opt.map(it => getSingleProperty(it,propGetter,defaultProp,defaultValue))
    } else {
      return getSingleProperty(opt,propGetter,defaultProp,defaultValue)
    }

  }

  const
    [focusedValue,setFocusedValue] = useState<string | number | null>(() => getValue(() => getProperty(options[0], valueGetter,"id",null))),
    rootRef = useRef<any>(null),
    makeMoveSelection = useCallback((increment:number):(() => void) => {
      return () => {
        setFocusedValue(focusedValue => {
        let index = options.findIndex(opt => getProperty(opt, valueGetter, "id") === focusedValue)
        if (index === -1) {
          log.warn("Unable to find current value", focusedValue, options)
          index = 0
        } else {
          index = Math.max(0, Math.min(index + increment, options.length - 1))
        }

        const value = getValue(() => getProperty(options[index], valueGetter, "id"))
        if (!isDefined(value)) {
          log.warn("Unable to find option at ", index, value, options)
          return focusedValue
        } else {
          return value
        }
        })
      }

    },[setFocusedValue,valueGetter,options]),
    makeFocusedSelect = useCallback(():(() => void) => ():void => {
      setFocusedValue(focusedValue => {
        guard(() => onSelected(options.find(opt => getProperty(opt, valueGetter, "id") === focusedValue)))
        return focusedValue
      })
    },[options,onSelected,valueGetter,setFocusedValue]),
    {props:commandManagerProps} = useCommandManager(
      id,
      useCallback(builder =>
        builder
          .command("Escape", onClose,{
            overrideInput: true
          })
          .command("Enter", makeFocusedSelect(), {
            overrideInput: true
          })
          .command("ArrowDown", makeMoveSelection(1), {
            overrideInput: true
          })
          .command("ArrowUp", makeMoveSelection(-1), {
            overrideInput: true
          })
          .make(),[makeFocusedSelect,onClose,makeMoveSelection]),
       rootRef
    ),
    [query, setQuery] = useState(""),
    [filteredOptions, setFilteredOptions] = useState(options),
    optionClasses = {
      root: classes.option,
      selected: "selected"
    }



  useEffect(
    () => {
      setQuery("")
      setFilteredOptions(options)
    },
    [options]
  )





  const onQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value
    setQuery(query)
    setFilteredOptions(options.filter(opt => {
      const label = getProperty(opt, labelGetter, "label", "") as string
      return new RegExp(query,"i").test(label)
    }))

  },[options,labelGetter])

  const
    selectedOptions = useMemo(() =>
        !selectedOption ? [] : (Array.isArray(selectedOption) ?selectedOption : [selectedOption]) as Array<T>
    ,[selectedOption]),
    selectedValues = useMemo(() => getProperty(
      selectedOptions,
      valueGetter,
      "value"
    ),[selectedOptions,valueGetter]),
    selectionValid = !selectedValues.isEmpty() || selectedValues.every(opt => !opt || (!isNumber(opt) && !isString(opt)))

  // if (open) {
  //   log.info(id, "Selected options", selectedOptions, "Selected values", selectedValues, "Valid", selectionValid, anchorEl)
  // }
  return !open || !anchorEl ? null : <Popper id={id} open={open} anchorEl={anchorEl} transition>
    {({TransitionProps}) => (
      <Grow {...TransitionProps} timeout={250}>
        <ClickAwayListener onClickAway={onClose}>
          <div
            ref={rootRef}
            className={classes.paper}
            {...other}
            {...commandManagerProps}
          >
            {/*style={elevationStyles.elevation4}*/}

            {/* FILTER INPUT */}
            {filterable && <input
              autoFocus
              placeholder={filterPlaceholder || "Filter..."}
              className={classes.input}
              value={query}
              onChange={onQueryChange}/>
            }


            {/* NO OPTIONS */}
            {!filteredOptions.length && noneLabel && <MenuItem
              component="div"
              classes={optionClasses}
              onClick={makeOnSelected(null)}
            >
              {noneLabel}
            </MenuItem>
            }


            {/* DESELECT, UNSELECT OPTION */}
            {unselectLabel && filteredOptions.length && <MenuItem
              selected={selectionValid}
              component="div"
              classes={optionClasses}
              style={mergeStyles({
                fontWeight: !selectionValid ? 500 : 400
              },getValue(() => styleGetter(null,!selectionValid)))}
              button
              onClick={makeOnSelected(null)}
            >
              {unselectLabel}
            </MenuItem>}


            {/* REGULAR OPTIONS */}
            {filteredOptions.map(opt => {
              const
                value = getProperty(opt, valueGetter, "value"),
                label = getProperty(opt, labelGetter, "label"),
                focused = value === focusedValue,
                selected = selectedValues.some(selectedValue => selectedValue === value),
                style = mergeStyles({
                  fontWeight: selected ? 500 : 400
                },getValue(() => styleGetter(opt, selected)))

              return <MenuItem
                key={value}
                selected={selected}
                component="div"
                className={mergeClasses(classes.option, focused && "focused", selected && "selected")}
                classes={optionClasses}
                style={style}
                button
                onClick={makeOnSelected(opt)}
              >
                <Highlighter
                  searchWords={query.isEmpty() ? [] : query.split(" ")}
                  textToHighlight={label as string}
                  highlightClassName={classes.highlight}
                  caseSensitive={false}
                  autoEscape={false}
                />
              </MenuItem>
            })}
          </div>
        </ClickAwayListener>
      </Grow>
    )}
  </Popper>
})

