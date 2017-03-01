//Apply a variety of  APIs to operate VNode

import { componentMountBoundary } from './lifecycle'

/**
 * append node
 *
 * @param {number} newType
 * @param {VNode}  newNode
 * @param {Node}   parentNode
 * @param {Node}   nextNode
 */
export function appendNode(newType, newNode, parentNode, nextNode) {

    var instance = newNode.instance
    var ok = newType === 2 && instance
        // lifecycle, componentWillMount
    if (ok && instance.componentWillMount) {
        instance.componentWillMount(nextNode)
    }

    // append element
    parentNode.appendChild(nextNode)

    // lifecycle, componentDidMount
    if (ok && instance.componentDidMount) {
        instance.componentDidMount(nextNode)
    }
}


/**
 * create DOMNode
 *
 * @param {number}    type
 * @param {Component} component
 */
export function createDOMNode(type, component) {
    try {
        return document.createElement(type);
    } catch (error) {
        return createDOMNodeError(
            componentRenderBoundary(component, 'element', type, error),
            component
        );
    }
}

/**
 * create error state DOMNode
 * 
 * @param  {VNode}      vnode
 * @param  {Component?} component
 * @return {Node}
 */
export function createDOMNodeError(vnode, component) {
    // empty, null/undefined
    if (vnode == null) { //应该还有false
        return createNode(createEmptyShape(), null, null);
    }
    // string, number, element, array
    else {
        return createNode(createElement('@', null, vnode), component, null);
    }
}

/**
 * create namespaced DOMNode
 *
 * @param {namespace} namespace
 * @param {number}    type
 * @param {Componnet} component
 */
export function createDOMNodeNS(namespace, type, component) {
    try {
        return document.createElementNS(namespace, type);
    } catch (error) {
        return createDOMNodeError(
            componentRenderBoundary(component, 'element', type, error),
            component
        );
    }
}

/**
 * insert node
 *
 * @param {number} newType
 * @param {VNode}  newNode
 * @param {Node}   prevNode
 * @param {Node}   parentNode
 * @param {Node}   nextNode
 */
export function insertNode(newType, newNode, prevNode, parentNode, nextNode) {
    var instance = newNode.instance
    var ok = newType === 2 && instance

    // lifecycle, componentWillMount
    if (ok && instance.componentWillMount) {
        instance.componentWillMount(nextNode);
    }

    // insert element
    parentNode.insertBefore(nextNode, prevNode);

    // lifecycle, componentDidMount
    if (ok && instance.componentDidMount) {
        instance.componentDidMount(nextNode);
    }
}

/**
 * remove node
 *
 * @param {number} oldType
 * @param {VNode}  oldNode
 * @param {Node}   parentNode
 */
export function removeNode(oldType, oldNode, parentNode) {
    // lifecycle, componentWillUnmount
    var instance = oldNode.instance
    if (oldType === 2 && instance && instance.componentWillUnmount) {
        instance.componentWillUnmount(oldNode.DOMNode);
    }

    // remove element
    parentNode.removeChild(oldNode.DOMNode);

    // clear references
    oldNode.DOMNode = null;
}

/**
 * replace node
 *
 * @param {VNode} newType
 * @param {VNode} oldType
 * @param {VNode} newNode
 * @param {VNode} oldNode
 * @param {Node}  parentNode 
 * @param {Node}  nextNode
 */
export function replaceNode(newType, oldType, newNode, oldNode, parentNode, nextNode) {
    // lifecycle, componentWillUnmount
    var instance = oldNode.instance
    if (oldType === 2 && instance && instance.componentWillUnmount) {
        instance.componentWillUnmount(oldNode.DOMNode);
    }

    // lifecycle, componentWillMount
    instance = newNode.instance
    var ok = newType === 2 && instance
    if (ok && instance.componentWillMount) {
        instance.componentWillMount(nextNode);
    }

    // replace element
    parentNode.replaceChild(nextNode, oldNode.DOMNode);

    // lifecycle, componentDidmount
    if (ok && instance.componentDidMount) {
        instance.componentDidMount(nextNode);
    }

    // clear references
    oldNode.DOMNode = null;
}

/**
 * replace root node
 * 
 * @param  {VNode}     newNode
 * @param  {VNode}     oldNode
 * @param  {number}    newType
 * @param  {number}    oldType
 * @param  {Component} component
 */
export function replaceRootNode(newNode, oldNode, newType, oldType, component) {
    var refDOMNode = oldNode.DOMNode;
    var newProps = newNode.props;

    // replace node
    refDOMNode.parentNode.replaceChild(createNode(newNode, component, null), refDOMNode);

    // hydrate new node
    oldNode.props = newProps;
    oldNode.nodeName = newNode.nodeName || newNode.type;
    oldNode.children = newNode.children;
    oldNode.DOMNode = newNode.DOMNode;

    //  stylesheet
    if (newType !== 3 && component.stylesheet !== void 0) {
        createScopedStylesheet(component, component.constructor, newNode.DOMNode);
    }
}


/**
 * empty node
 *
 * @param {VNode}  oldNode
 * @param {number} oldLength
 */
export function emptyNode(oldNode, oldLength) {
    var children = oldNode.children;
    var parentNode = oldNode.DOMNode;
    var oldChild;

    // umount children
    for (var i = 0; i < oldLength; i++) {
        oldChild = children[i];
        var instance = oldChild.instance
            // lifecycle, componentWillUnmount
        if (oldChild.Type === 2 && instance && instance.componentWillUnmount) {
            instance.componentWillUnmount(oldChild.DOMNode);
        }

        // clear references
        oldChild.DOMNode = null;
    }

    parentNode.textContent = '';
}


/**
 * create node
 * 
 * @param  {VNode}      subject
 * @param  {Component?} component
 * @param  {string?}    namespace
 * @return {Node}
 */
export function createNode(subject, component, namespace) {
    var nodeType = subject.Type;

    // create text node element	
    if (nodeType === 3) {
        return subject.DOMNode = document.createTextNode(subject.children);
    }

    var vnode;
    var element;

    var portal = false;

    // DOMNode exists
    if (subject.DOMNode !== null) {
        element = subject.DOMNode;

        // portal
        if (portal = (nodeType === 4 || nodeType === 5)) {
            element = (vnode = subject).DOMNode = (nodeType === 4 ? element.cloneNode(true) : element);
        }
        // hoisted
        else {
            return subject.DOMNode = element.cloneNode(true);
        }
    }
    // create DOMNode
    else {
        vnode = nodeType === 2 ? extractComponentNode(subject, null, null) : subject;
    }

    var Type = vnode.Type;
    var children = vnode.children;

    if (portal === false) {
        // text		
        if (Type === 3) {
            return vnode.DOMNode = subject.DOMNode = document.createTextNode(children);
        }
        // portal
        else if (Type === 4 || Type === 5) {
            element = vnode.DOMNode;
            portal = true;
        }
    }

    var type = vnode.type;
    var props = vnode.props;
    var length = children.length;

    var instance = subject.instance !== null;
    var thrown = 0;

    // assign namespace
    if (props.xmlns !== void 0) {
        namespace = props.xmlns;
    }

    // has a component instance, hydrate component instance
    if (instance) {
        component = subject.instance;
        thrown = component['--throw'];
    }

    if (portal === false) {
        // create namespaced element
        if (namespace !== null) {
            // if undefined, assign svg namespace
            if (props.xmlns === void 0) {
                props === objEmpty ? (props = { xmlns: namespace }) : (props.xmlns = namespace);
            }

            element = createDOMNodeNS(namespace, type, component);
        }
        // create html element
        else {
            element = createDOMNode(type, component);
        }

        vnode.DOMNode = subject.DOMNode = element;
    }

    if (instance) {
        // avoid appending children if an error was thrown while creating a DOMNode
        if (thrown !== component['--throw']) {
            return vnode.DOMNode = subject.DOMNode = element;
        }

        vnode = component['--vnode'];

        // hydrate
        if (vnode.DOMNode === null) {
            vnode.DOMNode = element;
        }

        // stylesheets
        if (nodeType === 2 && component.stylesheet !== void 0 && type !== 'noscript' && type !== '#text') {
            createScopedStylesheet(component, subject.type, element);
        }
    }

    // has children
    if (length !== 0) {
        // append children
        for (var i = 0; i < length; i++) {
            var newChild = children[i];

            // hoisted, clone
            if (newChild.DOMNode !== null) {
                newChild = children[i] = cloneNode(newChild);
            }

            // append child
            appendNode(newChild.Type, newChild, element, createNode(newChild, component, namespace));
        }
    }

    // has props
    if (props !== objEmpty) {
        // props and events
        assignProps(element, props, false, component);
    }

    // cache DOM reference
    return element;
}

function cloneNode(subject) {
    return createNodeShape(
        subject.Type,
        subject.type,
        subject.props,
        subject.children,
        subject.DOMNode,
        null,
        0,
        null,
        void 0
    );
}