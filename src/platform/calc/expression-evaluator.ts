/**
 * Part 12 — Sandboxed Expression Evaluator
 * 
 * Evaluates user-defined expressions in a sandboxed environment.
 * No eval, no property access into the host, no I/O, bounded execution.
 * Used by escalation rules, payroll components, posting rules, and workflow preconditions.
 */

import Decimal from 'decimal.js';

export type ExpressionResult = Decimal | boolean | string | number;

export interface EvalOptions {
  allowedVars?: string[];
  maxDepth?: number;
  maxSteps?: number;
  timeout?: number;
}

export class ExpressionError extends Error {
  constructor(
    public code: string,
    public details: Record<string, any>
  ) {
    super(`${code}: ${JSON.stringify(details)}`);
    this.name = 'ExpressionError';
  }
}

// Whitelisted functions
const FUNCTIONS: Record<string, (...args: any[]) => any> = {
  min: (...args: number[]) => Math.min(...args),
  max: (...args: number[]) => Math.max(...args),
  abs: (x: number) => Math.abs(x),
  round: (x: number, decimals = 0) => Number(new Decimal(x).toDecimalPlaces(decimals)),
  ceil: (x: number) => Math.ceil(x),
  floor: (x: number) => Math.floor(x),
  if: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
  slab: (value: number, slabs: Array<{ limit: number; rate: number }>) => {
    for (const slab of slabs) {
      if (value <= slab.limit) return value * slab.rate / 100;
    }
    return 0;
  },
  days: (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  },
  months: (from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth());
  },
};

// Token types
type TokenType = 'NUMBER' | 'STRING' | 'IDENT' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

// AST Node types
type NodeType = 'NUMBER' | 'STRING' | 'IDENT' | 'BINARY' | 'UNARY' | 'CALL';

interface ASTNode {
  type: NodeType;
  value?: any;
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
  argument?: ASTNode;
  name?: string;
  args?: ASTNode[];
}

export class ExpressionEvaluator {
  private cache: Map<string, ASTNode> = new Map();

  /**
   * Evaluate an expression with the given scope
   */
  evaluate(
    expr: string,
    scope: Record<string, any>,
    options: EvalOptions = {}
  ): ExpressionResult {
    const maxDepth = options.maxDepth ?? 32;
    const maxSteps = options.maxSteps ?? 10000;

    // Parse and cache the AST
    let ast = this.cache.get(expr);
    if (!ast) {
      ast = this.parse(expr);
      this.cache.set(expr, ast);
    }

    // Validate identifiers against whitelist
    const allowedVars = options.allowedVars ?? Object.keys(scope);
    this.assertWhitelisted(ast, allowedVars);

    // Evaluate with step budget
    const context = { depth: 0, maxDepth, steps: { n: 0, max: maxSteps } };
    return this.walk(ast, scope, context);
  }

  /**
   * Validate an expression without evaluating it
   * Used at save time to catch errors early
   */
  validate(expr: string, sampleScopes: Record<string, any>[]): void {
    const ast = this.parse(expr);
    
    for (const scope of sampleScopes) {
      try {
        this.evaluate(expr, scope, { maxSteps: 100 });
      } catch (error) {
        if (error instanceof ExpressionError) {
          throw error;
        }
        throw new ExpressionError('EXPRESSION_EVALUATION_FAILED', {
          expression: expr,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Parse an expression into an AST
   */
  private parse(expr: string): ASTNode {
    const tokens = this.tokenize(expr);
    const parser = new Parser(tokens);
    return parser.parse();
  }

  /**
   * Tokenize an expression string
   */
  private tokenize(expr: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (/[0-9.]/.test(char)) {
        let num = '';
        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i++];
        }
        tokens.push({ type: 'NUMBER', value: num });
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const quote = char;
        i++;
        let str = '';
        while (i < expr.length && expr[i] !== quote) {
          str += expr[i++];
        }
        i++; // Skip closing quote
        tokens.push({ type: 'STRING', value: str });
        continue;
      }

      // Identifiers
      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < expr.length && /[a-zA-Z0-9_.]/.test(expr[i])) {
          ident += expr[i++];
        }
        tokens.push({ type: 'IDENT', value: ident });
        continue;
      }

      // Operators
      if ('+-*/%^<>=!&|'.includes(char)) {
        let op = char;
        i++;
        // Handle two-character operators
        if (i < expr.length && '=<>&|'.includes(expr[i])) {
          op += expr[i++];
        }
        tokens.push({ type: 'OPERATOR', value: op });
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      // Comma
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      throw new ExpressionError('INVALID_CHARACTER', { char, position: i });
    }

    tokens.push({ type: 'EOF', value: '' });
    return tokens;
  }

  /**
   * Assert that all identifiers in the AST are whitelisted
   */
  private assertWhitelisted(ast: ASTNode, allowed: string[]): void {
    const identifiers = this.collectIdentifiers(ast);
    
    for (const id of identifiers) {
      if (id.kind === 'fn') {
        if (!(id.name in FUNCTIONS)) {
          throw new ExpressionError('EXPRESSION_FUNCTION_NOT_ALLOWED', { name: id.name });
        }
      } else if (id.kind === 'var') {
        const rootVar = id.name.split('.')[0];
        if (!allowed.includes(rootVar)) {
          throw new ExpressionError('EXPRESSION_VARIABLE_NOT_ALLOWED', { name: id.name });
        }
      }
    }
  }

  /**
   * Collect all identifiers (variables and functions) from an AST
   */
  private collectIdentifiers(ast: ASTNode): Array<{ kind: 'var' | 'fn'; name: string }> {
    const identifiers: Array<{ kind: 'var' | 'fn'; name: string }> = [];

    const walk = (node: ASTNode) => {
      if (node.type === 'IDENT') {
        identifiers.push({ kind: 'var', name: node.value });
      } else if (node.type === 'CALL') {
        identifiers.push({ kind: 'fn', name: node.name! });
        node.args?.forEach(walk);
      } else if (node.type === 'BINARY') {
        walk(node.left!);
        walk(node.right!);
      } else if (node.type === 'UNARY') {
        walk(node.argument!);
      }
    };

    walk(ast);
    return identifiers;
  }

  /**
   * Walk the AST and evaluate
   */
  private walk(
    node: ASTNode,
    scope: Record<string, any>,
    context: { depth: number; maxDepth: number; steps: { n: number; max: number } }
  ): ExpressionResult {
    // Check depth limit
    if (context.depth > context.maxDepth) {
      throw new ExpressionError('EXPRESSION_DEPTH_EXCEEDED', { maxDepth: context.maxDepth });
    }

    // Check step budget
    context.steps.n++;
    if (context.steps.n > context.steps.max) {
      throw new ExpressionError('EXPRESSION_STEP_BUDGET_EXCEEDED', { maxSteps: context.steps.max });
    }

    context.depth++;

    try {
      switch (node.type) {
        case 'NUMBER':
          return new Decimal(node.value);

        case 'STRING':
          return node.value;

        case 'IDENT':
          const value = this.resolveIdentifier(node.value, scope);
          if (value instanceof Decimal) return value;
          if (typeof value === 'number') return new Decimal(value);
          return value;

        case 'BINARY':
          const left = this.walk(node.left!, scope, context);
          const right = this.walk(node.right!, scope, context);
          return this.evaluateBinary(node.operator!, left, right);

        case 'UNARY':
          const arg = this.walk(node.argument!, scope, context);
          return this.evaluateUnary(node.operator!, arg);

        case 'CALL':
          const args = node.args!.map(a => this.walk(a, scope, context));
          return this.evaluateCall(node.name!, args);

        default:
          throw new ExpressionError('UNKNOWN_NODE_TYPE', { type: node.type });
      }
    } finally {
      context.depth--;
    }
  }

  /**
   * Resolve an identifier from scope (supports dot notation)
   */
  private resolveIdentifier(name: string, scope: Record<string, any>): any {
    const parts = name.split('.');
    let value: any = scope;

    for (const part of parts) {
      if (value === null || value === undefined) {
        throw new ExpressionError('VARIABLE_NOT_FOUND', { name });
      }
      value = value[part];
    }

    if (value === undefined) {
      throw new ExpressionError('VARIABLE_NOT_FOUND', { name });
    }

    return value;
  }

  /**
   * Evaluate a binary operation
   */
  private evaluateBinary(operator: string, left: ExpressionResult, right: ExpressionResult): ExpressionResult {
    // Arithmetic operations
    if (['+', '-', '*', '/', '%', '^'].includes(operator)) {
      const l = left instanceof Decimal ? left : new Decimal(left as number);
      const r = right instanceof Decimal ? right : new Decimal(right as number);

      switch (operator) {
        case '+': return l.plus(r);
        case '-': return l.minus(r);
        case '*': return l.times(r);
        case '/': 
          if (r.isZero()) throw new ExpressionError('DIVISION_BY_ZERO', {});
          return l.div(r);
        case '%': return l.mod(r);
        case '^': return l.pow(r);
      }
    }

    // Comparison operations
    if (['==', '!=', '<', '>', '<=', '>='].includes(operator)) {
      const l = left instanceof Decimal ? left.toNumber() : left;
      const r = right instanceof Decimal ? right.toNumber() : right;

      switch (operator) {
        case '==': return l === r;
        case '!=': return l !== r;
        case '<': return l < r;
        case '>': return l > r;
        case '<=': return l <= r;
        case '>=': return l >= r;
      }
    }

    // Logical operations
    if (['&&', '||'].includes(operator)) {
      const l = Boolean(left);
      const r = Boolean(right);

      switch (operator) {
        case '&&': return l && r;
        case '||': return l || r;
      }
    }

    throw new ExpressionError('UNKNOWN_OPERATOR', { operator });
  }

  /**
   * Evaluate a unary operation
   */
  private evaluateUnary(operator: string, arg: ExpressionResult): ExpressionResult {
    switch (operator) {
      case '-':
        if (arg instanceof Decimal) return arg.neg();
        return -(arg as number);
      case '!':
        return !Boolean(arg);
      default:
        throw new ExpressionError('UNKNOWN_UNARY_OPERATOR', { operator });
    }
  }

  /**
   * Evaluate a function call
   */
  private evaluateCall(name: string, args: ExpressionResult[]): ExpressionResult {
    const fn = FUNCTIONS[name];
    if (!fn) {
      throw new ExpressionError('FUNCTION_NOT_FOUND', { name });
    }

    const convertedArgs = args.map(a => 
      a instanceof Decimal ? a.toNumber() : a
    );

    const result = fn(...convertedArgs);
    
    if (typeof result === 'number') {
      return new Decimal(result);
    }
    
    return result;
  }
}

/**
 * Parser for expressions (recursive descent)
 */
class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  parse(): ASTNode {
    const ast = this.parseExpression();
    if (this.peek().type !== 'EOF') {
      throw new ExpressionError('UNEXPECTED_TOKEN', { token: this.peek() });
    }
    return ast;
  }

  private parseExpression(): ASTNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let left = this.parseLogicalAnd();

    while (this.peek().type === 'OPERATOR' && this.peek().value === '||') {
      this.consume();
      const right = this.parseLogicalAnd();
      left = { type: 'BINARY', operator: '||', left, right };
    }

    return left;
  }

  private parseLogicalAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.peek().type === 'OPERATOR' && this.peek().value === '&&') {
      this.consume();
      const right = this.parseEquality();
      left = { type: 'BINARY', operator: '&&', left, right };
    }

    return left;
  }

  private parseEquality(): ASTNode {
    let left = this.parseComparison();

    while (this.peek().type === 'OPERATOR' && ['==', '!='].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseComparison();
      left = { type: 'BINARY', operator: op, left, right };
    }

    return left;
  }

  private parseComparison(): ASTNode {
    let left = this.parseAddition();

    while (this.peek().type === 'OPERATOR' && ['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseAddition();
      left = { type: 'BINARY', operator: op, left, right };
    }

    return left;
  }

  private parseAddition(): ASTNode {
    let left = this.parseMultiplication();

    while (this.peek().type === 'OPERATOR' && ['+', '-'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseMultiplication();
      left = { type: 'BINARY', operator: op, left, right };
    }

    return left;
  }

  private parseMultiplication(): ASTNode {
    let left = this.parseUnary();

    while (this.peek().type === 'OPERATOR' && ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'BINARY', operator: op, left, right };
    }

    return left;
  }

  private parseUnary(): ASTNode {
    if (this.peek().type === 'OPERATOR' && ['-', '!'].includes(this.peek().value)) {
      const op = this.consume().value;
      const arg = this.parseUnary();
      return { type: 'UNARY', operator: op, argument: arg };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.consume();
      return { type: 'NUMBER', value: token.value };
    }

    if (token.type === 'STRING') {
      this.consume();
      return { type: 'STRING', value: token.value };
    }

    if (token.type === 'IDENT') {
      this.consume();
      
      // Check if it's a function call
      if (this.peek().type === 'LPAREN') {
        this.consume(); // Skip '('
        const args: ASTNode[] = [];
        
        if (this.peek().type !== 'RPAREN') {
          args.push(this.parseExpression());
          while (this.peek().type === 'COMMA') {
            this.consume();
            args.push(this.parseExpression());
          }
        }
        
        if (this.peek().type !== 'RPAREN') {
          throw new ExpressionError('EXPECTED_RPAREN', {});
        }
        this.consume(); // Skip ')'
        
        return { type: 'CALL', name: token.value, args };
      }
      
      return { type: 'IDENT', value: token.value };
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      if (this.peek().type !== 'RPAREN') {
        throw new ExpressionError('EXPECTED_RPAREN', {});
      }
      this.consume();
      return expr;
    }

    throw new ExpressionError('UNEXPECTED_TOKEN', { token });
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }
}

export const expressionEvaluator = new ExpressionEvaluator();
