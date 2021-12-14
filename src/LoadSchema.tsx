import React, { ReactNode } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { JsonSchema } from './schema';
import Spinner from '@atlaskit/spinner';
import EmptyState from '@atlaskit/empty-state';
import { addRecentlyViewedLink } from './recently-viewed';
import YAML from 'yaml';

export type LoadSchemaProps = RouteComponentProps & {
   children: (schema: JsonSchema) => ReactNode;
};

export type LoadSchemaError = {
   message: string;
};

export type LoadSchemaState = {
   result?: ResultState;
   noSchema?: boolean;
};

export type ResultState = {
   currentUrl: string;
   schema: JsonSchema | LoadSchemaError;
}

function isLoadSchemaError(e: JsonSchema | LoadSchemaError): e is LoadSchemaError {
   return typeof e !== 'boolean' && 'message' in e;
}

class LoadSchemaWR extends React.PureComponent<LoadSchemaProps, LoadSchemaState> {
   state: LoadSchemaState = {

   };

   componentDidUpdate(prevProps: LoadSchemaProps, prevState: LoadSchemaState) {
      const url = this.getUrlFromProps();
      if (prevState.result !== undefined && prevState.result.currentUrl !== url && url !== null) {
         this.loadUrl(url);
      }
   }

   componentDidMount() {
      const url = this.getUrlFromProps();
      if (url !== null) {
         this.loadUrl(url);
      } else {
        this.setState({ noSchema: true })
      }
   }

   private getUrlFromProps(): string | null {
      const urlToFetch = new URLSearchParams(this.props.location.search);
      return urlToFetch.get('url') ;
   }

   private loadUrl(url: string): void {
      fetch(url)
         .then(resp => resp.text())
         .then(raw => {
            try {
              return JSON.parse(raw);
            } catch (e) {
              return YAML.parse(raw);
            }
         })
         .then(schema => this.setState({ result: { schema, currentUrl: url } }))
         .catch(e => this.setState({ result: { currentUrl: url, schema: { message: e.message }}}));
   }

   render() {
      const { result, noSchema } = this.state;
      if (noSchema) {
        return (
            <EmptyState
               header="No schema to load?"
               description="Unable to find any schema to load at the given URL."
               primaryAction={(
                  <p>Did you set <code>?url=http://...</code>?</p>
               )}
            />
        )
      }

      if (result === undefined) {
         return (
            <EmptyState
               header="Loading schema..."
               description="Attempting to pull the JSON Schema from the public internet."
               primaryAction={(
                  <Spinner size="xlarge" />
               )}
            />
         );
      }

      if (isLoadSchemaError(result.schema)) {
         return (
            <EmptyState
               header="Schema load failed"
               description="Attempted to pull the JSON Schema from the public internet."
               primaryAction={(
                  <p>Error: ${result.schema.message}</p>
               )}
            />
         );
      }

      const { children } = this.props;
      if (typeof children !== 'function') {
         throw new Error('The children of the LoadSchema must be a function to accept the schema.')
      }
      const linkTitle = typeof result.schema !== 'boolean' ? result.schema.title || result.currentUrl : result.currentUrl;
      addRecentlyViewedLink({
         title: linkTitle,
         url: result.currentUrl
      });
      return <>{children(result.schema)}</>;
   }
}

export const LoadSchema = withRouter<LoadSchemaProps, typeof LoadSchemaWR>(LoadSchemaWR);
