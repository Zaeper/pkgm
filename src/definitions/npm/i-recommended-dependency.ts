import {EDependencyType} from "../../services/npm/e-dependency-type";

export interface IRecommendedDependency {
    version: string,
    semanticOperator: string | null,
    trace: string[],
    isNewToAdd: boolean,
    dependencyType: EDependencyType,
    modifiedThrough: string | undefined,
    deprecated: string | undefined
}

export interface IDependencyRecommendations {
    dependencies: Record<string, IRecommendedDependency>
}