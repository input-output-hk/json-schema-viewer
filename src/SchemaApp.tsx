import { AtlassianNavigation, Create, ProductHome } from '@atlaskit/atlassian-navigation';
import { AtlassianIcon, AtlassianLogo } from '@atlaskit/logo';
import React from 'react';
import { Redirect, Route, RouteComponentProps, HashRouter, useHistory, withRouter } from 'react-router-dom';
import { LoadSchema } from './LoadSchema';
import { JsonSchema } from './schema';
import { SchemaView } from './SchemaView';
import { Start } from './Start';
import { PopupMenuGroup, Section, ButtonItem, LinkItem, LinkItemProps } from '@atlaskit/menu';
import { linkToRoot } from './route-path';
import { ContentPropsWithClose, PrimaryDropdown } from './PrimaryDropdown';
import { Docs } from './Docs';
import { getRecentlyViewedLinks, RecentlyViewedLink } from './recently-viewed';

const JsonSchemaHome = () => (
  <ProductHome icon={AtlassianIcon} logo={AtlassianLogo} siteTitle="JSON Schema Viewer" />
);

type NavigationButtonItemProps = {
  exampleUrl: string;
  onClick: () => void;
};

const NavigationButtonItem: React.FC<NavigationButtonItemProps> = (props) => {
  const history = useHistory();
  const linkLocation = linkToRoot(['view'], props.exampleUrl);
  const onClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    history.push(linkLocation);
    props.onClick();
  };
  return <LinkItem href={linkLocation} onClick={onClick}>{props.children}</LinkItem>
}

const NewTabLinkItem: React.FC<LinkItemProps> = (props) => <LinkItem target="_blank" rel="noopener noreferrer" {...props} />;

type RecentlyViewedMenuProps = ContentPropsWithClose & {
  recentlyViewed: Array<RecentlyViewedLink>;
};

const RecentlyViewedMenu: React.FC<RecentlyViewedMenuProps> = (props) => {
  const recentlyViewed = getRecentlyViewedLinks() || [];

  return (
    <PopupMenuGroup>
      <Section title="Recently viewed">
        {recentlyViewed.map(link => (
          <NavigationButtonItem key={link.url} onClick={props.closePopup} exampleUrl={link.url}>{link.title}</NavigationButtonItem>
        ))}
      </Section>
    </PopupMenuGroup>
  );
};

const ExampleMenu: React.FC<ContentPropsWithClose> = (props) => (
  <PopupMenuGroup>
    <Section title="Schema examples">
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://unpkg.com/@forge/manifest@latest/out/schema/manifest-schema.json">Atlassian Forge</NavigationButtonItem>
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://raw.githubusercontent.com/OAI/OpenAPI-Specification/3.0.3/schemas/v3.0/schema.json">OpenAPI (v3)</NavigationButtonItem>
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://json.schemastore.org/swagger-2.0">Swagger (v2)</NavigationButtonItem>
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://json.schemastore.org/package">package.json</NavigationButtonItem>
    </Section>
    <Section title="JSON Schema Meta Schemas">
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://json-schema.org/draft-07/schema">Draft-07</NavigationButtonItem>
      <NavigationButtonItem onClick={props.closePopup} exampleUrl="https://json-schema.org/draft-04/schema">Draft-04</NavigationButtonItem>
    </Section>
    <Section title="Schema repositories">
      <NewTabLinkItem href="https://www.schemastore.org/" onClick={props.closePopup}>Schemastore Repository</NewTabLinkItem>
    </Section>
  </PopupMenuGroup>
);

const HelpMenu: React.FC<ContentPropsWithClose> = (props) => {
  const history = useHistory();

  const goTo = (location: string) => {
    return (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      history.push(location);
      props.closePopup();
    };
  };

  return (
    <PopupMenuGroup>
      <Section title="Learn">
        <LinkItem href="/docs/introduction" onClick={goTo('/docs/introduction')}>Introduction</LinkItem>
        <ButtonItem onClick={goTo('/docs/usage')}>Linking your schema</ButtonItem>
        <NewTabLinkItem href="http://json-schema.org/understanding-json-schema/" onClick={props.closePopup}>Understanding JSON Schema</NewTabLinkItem>
      </Section>
      <Section title="Contribute">
        <NewTabLinkItem href="https://github.com/atlassian-labs/json-schema-viewer/issues/new" onClick={props.closePopup}>Raise issue</NewTabLinkItem>
        <NewTabLinkItem href="https://github.com/atlassian-labs/json-schema-viewer" onClick={props.closePopup}>View source code</NewTabLinkItem>
      </Section>
    </PopupMenuGroup>
  );
};

const NewSchema: React.FC = () => {
  const history = useHistory();
  const isStart = history.location.pathname === '/start';
  if (isStart) {
    return <></>;
  }

  return (
    <Create
      buttonTooltip="Render a new JSON Schema"
      iconButtonTooltip="Render a new JSON Schema"
      text="Load new schema"
      onClick={() => history.push('/start')}
    />
  );
};

export type LoadedState = {
  schemaUrl: string;
  loadedSchema: JsonSchema;
}

export type SchemaAppState = {
  loadedState?: LoadedState;
}

class SchemaAppWR extends React.PureComponent<RouteComponentProps, SchemaAppState> {
  state: SchemaAppState = {

  };

   render() {
    const primaryItems = [
      <PrimaryDropdown content={props => <ExampleMenu {...props} />} text="Examples" />,
      <PrimaryDropdown content={props => <HelpMenu {...props} />} text="Help" />
    ];

    const recentlyViewed = getRecentlyViewedLinks();
    if (recentlyViewed !== undefined) {
      primaryItems.unshift(
        <PrimaryDropdown content={props => <RecentlyViewedMenu recentlyViewed={recentlyViewed} {...props} />} text="Recently viewed" />
      );
    }

    return (
      <div>
        <HashRouter>
          <Route exact={true} path="/"><Redirect to="/view" /></Route>
          <Route path="/view">
            <LoadSchema>
              {(schema) => (
                <SchemaView
                  id={schema.$id}
                  basePathSegments={['view']}
                  schema={schema}
                  stage="both"
                />
              )}
            </LoadSchema>
          </Route>
        </HashRouter>
      </div>
    );
  }
}

export const SchemaApp = withRouter<RouteComponentProps, typeof SchemaAppWR>(SchemaAppWR);
