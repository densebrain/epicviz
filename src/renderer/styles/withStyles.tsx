import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as warning from 'warning';

const {getDynamicStyles} = require('jss');
import {getDisplayName} from '@material-ui/utils';

import {increment} from '@material-ui/styles/indexCounter';
import mergeClasses from '@material-ui/styles/mergeClasses';
import multiKeyStore from '@material-ui/styles/multiKeyStore';
import getStylesCreator from '@material-ui/styles/getStylesCreator';
import getThemeProps from '@material-ui/styles/getThemeProps';
import hoistStatics from '@material-ui/styles/hoistInternalStatics';
import {StylesContext} from '@material-ui/styles/StylesProvider';
import {ThemeContext} from '@material-ui/styles/ThemeProvider';
import getLogger from "common/log/Logger"
import * as _ from 'lodash'

const log = getLogger(__filename)

// We use the same empty object to ref count the styles that don't need a theme object.

const noopTheme = {};

export function getClasses({classes, Component, state, stylesOptions}):any {
  if (stylesOptions.disableGeneration) {
    return classes || {};
  }

  if (!state.cacheClasses) {
    state.cacheClasses = {
      // Cache for the finalized classes value.
      value: null,
      // Cache for the last used classes prop pointer.
      lastProp: null,
      // Cache for the last used rendered classes pointer.
      lastJSS: {},
    };
  }

  // Tracks if either the rendered classes or classes prop has changed,
  // requiring the generation of a new finalized classes object.
  let generate = false;

  if (state.classes !== state.cacheClasses.lastJSS) {
    state.cacheClasses.lastJSS = state.classes;
    generate = true;
  }
  if (classes !== state.cacheClasses.lastProp) {
    state.cacheClasses.lastProp = classes;
    generate = true;
  }

  if (generate) {
    state.cacheClasses.value = mergeClasses({
      baseClasses: state.cacheClasses.lastJSS,
      newClasses: classes,
      Component,
    });
  }

  return state.cacheClasses.value;
}

export function attach({state, props, theme, stylesOptions, stylesCreator, name}):any {
  if (stylesOptions.disableGeneration) {
    return;
  }

  state.stylesCreator = stylesCreator
  let sheetManager = multiKeyStore.get(stylesOptions.sheetsManager, stylesCreator, theme);

  if (!sheetManager) {
    sheetManager = {
      refs: 0,
      staticSheet: null,
      dynamicStyles: null,
    };
    multiKeyStore.set(stylesOptions.sheetsManager, stylesCreator, theme, sheetManager);
  }

  const options = {
    ...stylesCreator.options,
    ...stylesOptions,
    theme,
    flip: typeof stylesOptions.flip === 'boolean' ? stylesOptions.flip : theme.direction === 'rtl',
  };
  options.generateId = options.generateClassName;

  const sheetsRegistry = stylesOptions.sheetsRegistry;

  if (sheetManager.refs === 0) {
    let staticSheet;

    if (stylesOptions.sheetsCache) {
      staticSheet = multiKeyStore.get(stylesOptions.sheetsCache, stylesCreator, theme);
    }

    const styles = stylesCreator.create(theme, name);

    if (!staticSheet) {
      staticSheet = stylesOptions.jss.createStyleSheet(styles, {
        link: false,
        ...options,
      });

      staticSheet.attach();

      if (stylesOptions.sheetsCache) {
        multiKeyStore.set(stylesOptions.sheetsCache, stylesCreator, theme, staticSheet);
      }
    }

    if (sheetsRegistry) {
      sheetsRegistry.add(staticSheet);
    }

    sheetManager.dynamicStyles = getDynamicStyles(styles);
    sheetManager.staticSheet = staticSheet;
  }

  if (sheetManager.dynamicStyles) {
    const dynamicSheet = stylesOptions.jss.createStyleSheet(sheetManager.dynamicStyles, {
      link: true,
      ...options,
    });

    warning(props, 'Material-UI: properties missing.');

    dynamicSheet.update(props).attach();

    state.dynamicSheet = dynamicSheet;

    if (sheetsRegistry) {
      sheetsRegistry.add(dynamicSheet);
    }

    state.classes = mergeClasses({
      baseClasses: sheetManager.staticSheet.classes,
      newClasses: dynamicSheet.classes,
    });
  } else {
    state.classes = sheetManager.staticSheet.classes;
  }

  sheetManager.refs += 1;
}

export function update({state, props}):any {
  if (state.dynamicSheet) {
    state.dynamicSheet.update(props);
  }
}

export function detach({state, theme, stylesOptions, stylesCreator}):any {
  if (stylesOptions.disableGeneration) {
    return;
  }

  const sheetManager = multiKeyStore.get(stylesOptions.sheetsManager, state.stylesCreator, theme) ||
    multiKeyStore.get(stylesOptions.sheetsManager, stylesCreator, theme)

  if (!sheetManager) {
    log.warn("Unable to find sheetManager", state)
    return
  }
    sheetManager.refs -= 1;
  const  sheetsRegistry = stylesOptions.sheetsRegistry;

    if (sheetManager.refs === 0) {
      multiKeyStore.delete(stylesOptions.sheetsManager, state.stylesCreator, theme);
      stylesOptions.jss.removeStyleSheet(sheetManager.staticSheet);

      if (sheetsRegistry) {
        sheetsRegistry.remove(sheetManager.staticSheet);
      }

  }

  if (state.dynamicSheet) {
    stylesOptions.jss.removeStyleSheet(state.dynamicSheet);

    if (sheetsRegistry) {
      sheetsRegistry.remove(state.dynamicSheet);
    }
  }
}

// Link a style sheet with a component.
// It does not modify the component passed to it;
// instead, it returns a new component, with a `classes` property.
const withStyles = (stylesOrCreator:any, options:any = {}):any => (Component:any):any => {
  const {withTheme = false, withRef = false, name, defaultTheme: defaultThemeOption, ...stylesOptions2} = options;
  const stylesCreator = getStylesCreator(stylesOrCreator);
  const listenToTheme = stylesCreator.themingEnabled || typeof name === 'string' || withTheme;
  const defaultTheme = defaultThemeOption || noopTheme;

  let meta = name;

  if (process.env.NODE_ENV !== 'production' && !meta) {
    // Provide a better DX outside production.
    meta = getDisplayName(Component);
    warning(
      typeof meta === 'string',
      [
        'Material-UI: the component displayName is invalid. It needs to be a string.',
        `Please fix the following component: ${Component}.`,
      ].join('\n'),
    );
  }

  stylesCreator.options = {
    // Side effect.
    index: increment(),
    // Use for the global CSS option.
    name: name || Component.displayName,
    // Help with debuggability.
    meta,
    classNamePrefix: meta,
  };

  class WithStylesInner extends React.Component<any, any> {

    private theme:any

    constructor(props, context) {
      super(props, context);
      this.state = {
        styles: {},
      };
    }

    componentDidUpdate() {
      update({
        props: this.props,
        state: this.state.styles,
      });
    }

    componentWillUnmount() {
      detach({
        state: this.state.styles,
        stylesCreator,
        stylesOptions: this.props.stylesOptions,
        theme: this.props.theme,
      });
    }

    // private renderComponent(props:any, ref:any) {
    //
    // }

    render() {
      const {classes, theme, innerRef, stylesOptions, ...other} = this.props;

      const oldTheme = this.theme;
      this.theme = theme;

      if (oldTheme !== theme) {
        attach({
          name,
          props: this.props,
          state: this.state.styles,
          stylesCreator,
          stylesOptions,
          theme,
        });

        if (oldTheme) {
          // Rerender the component so the underlying component gets the theme update.
          // By theme update we mean receiving and applying the new class names.
          setTimeout(() => {
            detach({
              state: this.state.styles,
              stylesCreator,
              stylesOptions,
              theme: oldTheme,
            });
          });
        }
      }

      const more = getThemeProps({theme, name, props: other});

      // Provide the theme to the wrapped component.
      // So we don't have to use the `withTheme()` Higher-order Component.
      if (withTheme) {
        more.theme = theme;
      }

      return (
      // withRef ?
      //   React.forwardRef((props,ref) => <Component
      //     ref={ref}
      //     classes={getClasses({
      //       classes,
      //       Component,
      //       state: this.state.styles,
      //       stylesOptions,
      //     })}
      //     {..._.omit(more,"ref")}
      //   />) :
        <Component
          ref={innerRef}
          classes={getClasses({
            classes,
            Component,
            state: this.state.styles,
            stylesOptions,
          })}
          {...more}
        />
      )
    }
  }

  ;(WithStylesInner as any).propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes: PropTypes.object,
    stylesOptions: PropTypes.object.isRequired,
    theme: PropTypes.object,
  };

  const WithStyles = React.forwardRef((props, ref) => (
    <StylesContext.Consumer>
      {stylesOptions1 => {
        const stylesOptions = {
          ...stylesOptions1,
          ...stylesOptions2,
        };

        return listenToTheme ? (
          <ThemeContext.Consumer>
            {theme => (
              <WithStylesInner
                stylesOptions={stylesOptions}
                innerRef={ref as any}
                theme={theme || defaultTheme}
                {...props}
              />
            )}
          </ThemeContext.Consumer>
        ) : (
          <WithStylesInner
            stylesOptions={stylesOptions}
            innerRef={ref as any}
            theme={defaultTheme}
            {...props}
          />
        );
      }}
    </StylesContext.Consumer>
  ));

  ;(WithStyles as any).propTypes = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes: PropTypes.object,
    /**
     * Use that property to pass a ref callback to the decorated component.
     */
    innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  };

  if (process.env.NODE_ENV !== 'production') {
    WithStyles.displayName = `WithStyles(${getDisplayName(Component)})`;
  }

  hoistStatics(WithStyles, Component);

  if (process.env.NODE_ENV !== 'production') {
    // Exposed for test purposes.
    ;(WithStyles as any).Naked = Component;
    ;(WithStyles as any).options = options;
  }

  return WithStyles;
};

export default withStyles;
