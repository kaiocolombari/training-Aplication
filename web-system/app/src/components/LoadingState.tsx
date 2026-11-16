type LoadingStateProps = {
    label: string;
    className?: string;
};

export function LoadingState({ label, className = "" }: LoadingStateProps) {
    return (
        <div role="status" aria-live="polite" className={`ui-loading-state ${className}`.trim()}>
            <span className="ui-spinner" aria-hidden="true" />
            <span>{label}</span>
        </div>
    );
}
