module.exports = {
  extends: ['airbnb', 'airbnb/hooks'],
  plugins: [],
  parser: 'babel-eslint',
  env: {
    browser: true,
    jasmine: true,
    jest: true,
  },
  rules: {
    'arrow-parens': [2, 'as-needed', { requireForBlockBody: true }],
    'comma-dangle': [
      2,
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      },
    ],
    'max-len': [
      2,
      {
        code: 120,
        comments: 150,
        ignoreUrls: true,
      },
    ],
    'no-alert': [0],
    'no-confusing-arrow': [0],
    'no-console': [1],
    'no-param-reassign': [2, { props: false }],
    'no-plusplus': [0],
    'no-unused-expressions': [2, { allowTaggedTemplates: true }],
    'quote-props': [2, 'consistent-as-needed'],

    // jsx-a11y
    'jsx-a11y/control-has-associated-label': [0],
    'jsx-a11y/label-has-for': [0],
    'jsx-a11y/label-has-associated-control': [2, { assert: 'either' }],
    'jsx-a11y/anchor-is-valid': ['error', {
      components: ['Link'],
      specialLink: ['hrefLeft', 'hrefRight'],
      aspects: ['invalidHref', 'preferButton'],
    }],

    // react
    'react/forbid-prop-types': [0],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/jsx-no-duplicate-props': [2, { ignoreCase: false }],
    'react/jsx-one-expression-per-line': [0],
    'react/jsx-props-no-spreading': [0],
    'react/prop-types': [1],
    'react/react-in-jsx-scope': [0],
  },
};
