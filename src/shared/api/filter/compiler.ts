/**
 * Part 05 — Filter Grammar Parser & Compiler
 * 
 * Implements a small, parsed, whitelisted expression language for filtering.
 * Never accepts raw SQL, and never string-concatenates a filter into a query.
 * 
 * Grammar:
 * expr    := or
 * or      := and ( 'or' and )*
 * and     := cmp ( 'and' cmp )*
 * cmp     := field op value | field 'in' '(' value(,value)* ')' | 'not' '(' expr ')' | '(' expr ')'
 * op      := 'eq'|'ne'|'gt'|'ge'|'lt'|'le'|'contains'|'startswith'|'between'|'isnull'
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterOp =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'ge'
  | 'lt'
  | 'le'
  | 'contains'
  | 'startswith'
  | 'between'
  | 'isnull'
  | 'in';

export type FieldType = 'string' | 'number' | 'date' | 'bool' | 'enum' | 'id';

export interface FieldSpec {
  column: string; // physical or mapped column name
  type: FieldType;
  ops: FilterOp[]; // whitelist of allowed operators
  enumValues?: string[]; // for enum fields
  requiresPermission?: string; // permission key required to filter by this field
}

export type FilterNode =
  | { kind: 'and'; children: FilterNode[] }
  | { kind: 'or'; children: FilterNode[] }
  | { kind: 'not'; child: FilterNode }
  | {
      kind: 'cmp';
      field: string;
      op: FilterOp;
      value: unknown;
    }
  | {
      kind: 'in';
      field: string;
      values: unknown[];
    };

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type Token =
  | { type: 'field'; value: string }
  | { type: 'op'; value: FilterOp }
  | { type: 'value'; value: unknown }
  | { type: 'and' }
  | { type: 'or' }
  | { type: 'not' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' }
  | { type: 'in' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    // Skip whitespace
    if (/\s/.test(input[i])) {
      i++;
      continue;
    }

    // Parentheses
    if (input[i] === '(') {
      tokens.push({ type: 'lparen' });
      i++;
      continue;
    }
    if (input[i] === ')') {
      tokens.push({ type: 'rparen' });
      i++;
      continue;
    }

    // Comma
    if (input[i] === ',') {
      tokens.push({ type: 'comma' });
      i++;
      continue;
    }

    // String literal
    if (input[i] === "'" || input[i] === '"') {
      const quote = input[i];
      i++;
      let value = '';
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          i++;
        }
        value += input[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: 'value', value });
      continue;
    }

    // Number
    if (/[0-9]/.test(input[i]) || (input[i] === '-' && /[0-9]/.test(input[i + 1]))) {
      let value = '';
      if (input[i] === '-') {
        value += '-';
        i++;
      }
      while (i < input.length && /[0-9.]/.test(input[i])) {
        value += input[i];
        i++;
      }
      tokens.push({ type: 'value', value: parseFloat(value) });
      continue;
    }

    // Boolean or null
    if (input.slice(i, i + 4) === 'true') {
      tokens.push({ type: 'value', value: true });
      i += 4;
      continue;
    }
    if (input.slice(i, i + 5) === 'false') {
      tokens.push({ type: 'value', value: false });
      i += 5;
      continue;
    }
    if (input.slice(i, i + 4) === 'null') {
      tokens.push({ type: 'value', value: null });
      i += 4;
      continue;
    }

    // Keywords and identifiers
    if (/[a-zA-Z_]/.test(input[i])) {
      let word = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        word += input[i];
        i++;
      }

      // Check for keywords
      if (word === 'and') {
        tokens.push({ type: 'and' });
      } else if (word === 'or') {
        tokens.push({ type: 'or' });
      } else if (word === 'not') {
        tokens.push({ type: 'not' });
      } else if (word === 'in') {
        tokens.push({ type: 'in' });
      } else if (
        ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'contains', 'startswith', 'between', 'isnull'].includes(
          word
        )
      ) {
        tokens.push({ type: 'op', value: word as FilterOp });
      } else {
        // Field name
        tokens.push({ type: 'field', value: word });
      }
      continue;
    }

    throw new Error(`Unexpected character at position ${i}: ${input[i]}`);
  }

  return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  parse(): FilterNode {
    const result = this.parseOr();
    if (this.pos < this.tokens.length) {
      throw new Error('Unexpected tokens after expression');
    }
    return result;
  }

  private parseOr(): FilterNode {
    const children = [this.parseAnd()];
    while (this.peek()?.type === 'or') {
      this.consume();
      children.push(this.parseAnd());
    }
    return children.length === 1 ? children[0] : { kind: 'or', children };
  }

  private parseAnd(): FilterNode {
    const children = [this.parseComparison()];
    while (this.peek()?.type === 'and') {
      this.consume();
      children.push(this.parseComparison());
    }
    return children.length === 1 ? children[0] : { kind: 'and', children };
  }

  private parseComparison(): FilterNode {
    const token = this.peek();

    // NOT expression
    if (token?.type === 'not') {
      this.consume();
      this.expect('lparen');
      const child = this.parseOr();
      this.expect('rparen');
      return { kind: 'not', child };
    }

    // Parenthesized expression
    if (token?.type === 'lparen') {
      this.consume();
      const expr = this.parseOr();
      this.expect('rparen');
      return expr;
    }

    // Field comparison
    if (token?.type === 'field') {
      const fieldToken = this.consume();
      if (fieldToken.type !== 'field') {
        throw new Error('Expected field token');
      }
      const field = fieldToken.value;
      const opToken = this.peek();

      // IN operator
      if (opToken?.type === 'in') {
        this.consume();
        this.expect('lparen');
        const values: unknown[] = [];
        values.push(this.expectValue());
        while (this.peek()?.type === 'comma') {
          this.consume();
          values.push(this.expectValue());
        }
        this.expect('rparen');
        return { kind: 'in', field, values };
      }

      // Standard comparison
      if (opToken?.type === 'op') {
        const opTokenConsumed = this.consume();
        if (opTokenConsumed.type !== 'op') {
          throw new Error('Expected op token');
        }
        const op = opTokenConsumed.value;
        
        // isnull doesn't need a value
        if (op === 'isnull') {
          return { kind: 'cmp', field, op, value: true };
        }

        const value = this.expectValue();
        return { kind: 'cmp', field, op, value };
      }

      throw new Error(`Expected operator after field ${field}`);
    }

    throw new Error('Expected field name or expression');
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(type: Token['type']): Token {
    const token = this.peek();
    if (!token || token.type !== type) {
      throw new Error(`Expected ${type} but got ${token?.type}`);
    }
    return this.consume();
  }

  private expectValue(): unknown {
    const token = this.peek();
    if (!token || token.type !== 'value') {
      throw new Error('Expected value');
    }
    const valueToken = this.consume();
    if (valueToken.type !== 'value') {
      throw new Error('Expected value token');
    }
    return valueToken.value;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseFilter(input: string): FilterNode {
  if (!input || input.trim() === '') {
    return { kind: 'and', children: [] };
  }

  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parse();
}

// ─── Compiler ─────────────────────────────────────────────────────────────────

export interface CompiledFilter {
  sql: string;
  params: unknown[];
}

export interface Actor {
  can(permission: string): boolean;
}

export function compileFilter(
  ast: FilterNode,
  fields: Record<string, FieldSpec>,
  actor: Actor
): CompiledFilter {
  const params: unknown[] = [];

  function walk(node: FilterNode): string {
    switch (node.kind) {
      case 'and':
        if (node.children.length === 0) return '1=1';
        return `(${node.children.map(walk).join(' AND ')})`;

      case 'or':
        if (node.children.length === 0) return '1=0';
        return `(${node.children.map(walk).join(' OR ')})`;

      case 'not':
        return `NOT (${walk(node.child)})`;

      case 'in': {
        const spec = fields[node.field];
        if (!spec) {
          throw new Error(`Unknown field: ${node.field}`);
        }
        if (!spec.ops.includes('in')) {
          throw new Error(`Operator 'in' not allowed for field ${node.field}`);
        }
        if (spec.requiresPermission && !actor.can(spec.requiresPermission)) {
          throw new Error(`Permission denied for field ${node.field}`);
        }

        const values = node.values.map((v) => coerce(v, spec));
        const placeholders = values.map(() => {
          params.push(values[params.length]);
          return `$${params.length}`;
        });
        return `${spec.column} IN (${placeholders.join(', ')})`;
      }

      case 'cmp': {
        const spec = fields[node.field];
        if (!spec) {
          throw new Error(`Unknown field: ${node.field}`);
        }
        if (!spec.ops.includes(node.op)) {
          throw new Error(`Operator '${node.op}' not allowed for field ${node.field}`);
        }
        if (spec.requiresPermission && !actor.can(spec.requiresPermission)) {
          throw new Error(`Permission denied for field ${node.field}`);
        }

        if (node.op === 'isnull') {
          return `${spec.column} IS NULL`;
        }

        const value = coerce(node.value, spec);
        params.push(value);
        const placeholder = `$${params.length}`;

        switch (node.op) {
          case 'eq':
            return `${spec.column} = ${placeholder}`;
          case 'ne':
            return `${spec.column} != ${placeholder}`;
          case 'gt':
            return `${spec.column} > ${placeholder}`;
          case 'ge':
            return `${spec.column} >= ${placeholder}`;
          case 'lt':
            return `${spec.column} < ${placeholder}`;
          case 'le':
            return `${spec.column} <= ${placeholder}`;
          case 'contains':
            return `${spec.column} ILIKE '%' || ${placeholder} || '%'`;
          case 'startswith':
            return `${spec.column} ILIKE ${placeholder} || '%'`;
          case 'between':
            // value should be an array [min, max]
            if (!Array.isArray(value) || value.length !== 2) {
              throw new Error('between operator requires an array of two values');
            }
            params.push(value[1]);
            return `${spec.column} BETWEEN $${params.length - 1} AND $${params.length}`;
          default:
            throw new Error(`Unsupported operator: ${node.op}`);
        }
      }
    }
  }

  const sql = walk(ast);
  return { sql, params };
}

// ─── Type Coercion ────────────────────────────────────────────────────────────

function coerce(value: unknown, spec: FieldSpec): unknown {
  switch (spec.type) {
    case 'string':
      if (typeof value !== 'string') {
        throw new Error(`Expected string for field, got ${typeof value}`);
      }
      return value;

    case 'number':
    case 'id':
      if (typeof value !== 'number') {
        throw new Error(`Expected number for field, got ${typeof value}`);
      }
      return value;

    case 'date':
      if (typeof value !== 'string') {
        throw new Error(`Expected date string for field, got ${typeof value}`);
      }
      // Validate ISO date format
      if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
        throw new Error(`Invalid date format: ${value}`);
      }
      return value;

    case 'bool':
      if (typeof value !== 'boolean') {
        throw new Error(`Expected boolean for field, got ${typeof value}`);
      }
      return value;

    case 'enum':
      if (typeof value !== 'string') {
        throw new Error(`Expected string for enum field, got ${typeof value}`);
      }
      if (spec.enumValues && !spec.enumValues.includes(value)) {
        throw new Error(
          `Invalid enum value: ${value}. Allowed: ${spec.enumValues.join(', ')}`
        );
      }
      return value;

    default:
      throw new Error(`Unknown field type: ${spec.type}`);
  }
}
